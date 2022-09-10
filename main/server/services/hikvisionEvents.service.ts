import { differenceInMinutes, format, parseISO } from "date-fns";
import { Sequelize } from "sequelize/types";
import { IpcResponse } from "../../../shared/ipc/types";
import logger from "../../../shared/logger";
import connection from "../../database/connection";
import equipamentoModel from "../../database/models/equipamento.model";
import eventoModel from "../../database/models/evento.model";
import pessoaModel from "../../database/models/pessoa.model";
import ipc from "../../ipc";
import socket from "../../socket";
import HikvisionEvent from "../types/HikvisionEvent";
import { TipoEvento } from "../types/TipoEvento";

function isIrrelevant(event: HikvisionEvent) {
  return (
    event.AccessControllerEvent.majorEventType != 5 ||
    event.AccessControllerEvent.subEventType != 75
  );
}

function hasCardNumber(event: HikvisionEvent) {
  const cardNumber = event?.AccessControllerEvent?.cardNo;
  return cardNumber && cardNumber.length && cardNumber.trim() !== "";
}

function toDate(dateTimeISO: string): string {
  return format(parseISO(dateTimeISO), "dd/MM/yyyy");
}

function toHour(dateTimeISO: string): string {
  return format(parseISO(dateTimeISO), "HH:mm:ss");
}

function toTimestamp(dateTimeISO: string): string {
  return `${toDate(dateTimeISO)} ${toHour(dateTimeISO)}`;
}

function getTipoEvento(event: HikvisionEvent): TipoEvento {
  const dateTime = parseISO(event.dateTime);
  const now = new Date();

  const minutes = differenceInMinutes(now, dateTime);

  if (minutes > 1) {
    logger.debug(
      `api:hikvisionEventsService:${event.logId} ${minutes}min ago (offline event)`
    );

    return "OFF";
  }

  return "ON";
}

function useStrToDate(sequelize: Sequelize, str: string, format: string) {
  return sequelize.fn("STR_TO_DATE", str, format);
}

async function create(event: HikvisionEvent): Promise<void> {
  const { dateTime, ipAddress, logId } = event;

  const equipamento = await equipamentoModel().findOne({
    where: { ip: ipAddress },
  });

  if (!equipamento) {
    logger.warn(
      `api:hikvisionEventsService:${logId} device with not found by ip ${ipAddress}`
    );
    return;
  }

  if (equipamento.ignorarEvento) {
    logger.warn(
      `api:hikvisionEventsService:${logId} device ${ipAddress} is ignoring events`
    );
    return;
  }

  if (hasCardNumber(event)) {
    const cardNumber = event.AccessControllerEvent.cardNo;

    const data = {
      timestamp: toTimestamp(dateTime),
      code: cardNumber,
    };

    const response: IpcResponse = {
      status: "success",
      data,
    };

    ipc.send("cards_content_add", response);
  }

  if (isIrrelevant(event)) {
    const major = event.AccessControllerEvent.majorEventType;
    const minor = event.AccessControllerEvent.subEventType;

    logger.warn(
      `api:hikvisionEventsService:${logId} irrelevant event ${major}:${minor}`
    );

    return;
  }

  const tipoEvento = getTipoEvento(event);

  const pessoaId = event.AccessControllerEvent.employeeNoString;

  const pessoa = await pessoaModel().findByPk(pessoaId);

  if (!pessoa) {
    logger.warn(
      `api:hikvisionEventsService:${logId} people not found by id ${pessoaId}`
    );
  }

  if (pessoa) {
    const sequelize = connection.getSequelize();

    const data = toDate(dateTime);
    const hora = toHour(dateTime);
    const dataHora = toTimestamp(dateTime);

    const evento = {
      pessoaId: pessoa.id,
      data: useStrToDate(sequelize, data, "%d/%m/%Y"),
      hora: useStrToDate(sequelize, `30/12/1899 ${hora}`, "%d/%m/%Y %H:%i:%S"),
      dataHora: useStrToDate(sequelize, dataHora, "%d/%m/%Y %H:%i:%S"),
      departamento: pessoa.departamento,
      nomeGrupoHorario: pessoa.nomeGrupoHorario,
      equipamentoId: equipamento.id,
      tipoCadastroPessoa: pessoa.tipoCadastro,
      sentido: equipamento.funcaoBotao1,
      tipo: tipoEvento,
    };

    await eventoModel().create(evento);
  }

  if (tipoEvento === "OFF") {
    return;
  }

  const ipWithPad = ipAddress.padEnd(15, " ");
  const timestamp = toTimestamp(dateTime);
  const tag = pessoa ? "<BLOF>" : "<HINI>";

  const message = `${tag}${pessoaId}@${ipWithPad}@0@0@${timestamp}@1`;

  socket.sendMessageToAll(message);
}

export default {
  create,
};
