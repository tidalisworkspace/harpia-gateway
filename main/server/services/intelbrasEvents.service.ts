import { differenceInMinutes, format, parse, parseISO } from "date-fns";
import { Sequelize } from "sequelize/types";
import { IpcResponse } from "../../../shared/ipc/types";
import logger from "../../../shared/logger";
import connection from "../../database/connection";
import equipamentoModel from "../../database/models/equipamento.model";
import eventoModel from "../../database/models/evento.model";
import pessoaModel from "../../database/models/pessoa.model";
import ipc from "../../ipc";
import socket from "../../socket";
import IntelbrasEvent, { EventInfo } from "../types/IntelbrasEvent";
import { TipoEvento } from "../types/TipoEvento";

function isIrrelevant(eventInfo: EventInfo) {
  return eventInfo.Code !== "AccessControl" || !eventInfo?.Data?.UserID;
}

function hasCardNumber(eventInfo: EventInfo) {
  const cardNumber = eventInfo?.Data?.CardNo;
  return cardNumber && cardNumber.length && cardNumber.trim() !== "";
}

function fromDateTimeString(str: string) {
  return parse(str, "dd-MM-yyyy HH:mm:ss", new Date());
}

function toDate(dateTimeStr: string): string {
  return format(fromDateTimeString(dateTimeStr), "dd/MM/yyyy");
}

function toHour(dateTimeStr: string): string {
  return format(fromDateTimeString(dateTimeStr), "HH:mm:ss");
}

function toTimestamp(dateTimeISO: string): string {
  return `${toDate(dateTimeISO)} ${toHour(dateTimeISO)}`;
}

function getTipoEvento(event: IntelbrasEvent): TipoEvento {
  const dateTime = fromDateTimeString(event.Time);
  const now = new Date();

  const minutes = differenceInMinutes(now, dateTime);

  return minutes > 1 ? "OFF" : "ON";
}

function useStrToDate(sequelize: Sequelize, str: string, format: string) {
  return sequelize.fn("STR_TO_DATE", str, format);
}

async function create(event: IntelbrasEvent): Promise<void> {
  const { logId, ip, Time: time } = event;

  const equipamento = await equipamentoModel().findOne({ where: { ip } });

  if (!equipamento) {
    logger.warn(
      `http:intelbrasEventsService:${logId} device with not found by ip ${ip}`
    );
    return;
  }

  if (equipamento.ignorarEvento) {
    logger.warn(
      `http:intelbrasEventsService:${logId} device ${ip} is ignoring events`
    );
    return;
  }

  for (const eventInfo of event.Events) {
    if (hasCardNumber(eventInfo)) {
      const cardNumber = eventInfo.Data.CardNo;

      const data = {
        timestamp: toTimestamp(time),
        code: parseInt(cardNumber, 16),
      };

      const response: IpcResponse = {
        status: "success",
        data,
      };

      ipc.send("cards_content_add", response);
    }

    if (isIrrelevant(eventInfo)) {
      logger.warn(`http:intelbrasEventsService:${logId} irrelevant event`);
      continue;
    }

    const tipoEvento = getTipoEvento(event);

    const pessoaId = eventInfo.Data.UserID;

    const pessoa = await pessoaModel().findByPk(pessoaId);

    if (!pessoa) {
      logger.warn(
        `http:intelbrasEventsService:${logId} people not found by id ${pessoaId}`
      );
    }

    if (pessoa) {
      const sequelize = connection.getSequelize();

      const data = toDate(time);
      const hora = toHour(time);
      const dataHora = toTimestamp(time);

      const evento = {
        pessoaId: pessoa.id,
        data: useStrToDate(sequelize, data, "%d/%m/%Y"),
        hora: useStrToDate(
          sequelize,
          `30/12/1899 ${hora}`,
          "%d/%m/%Y %H:%i:%S"
        ),
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
      logger.info(`http:intelbrasEventsService:${logId} offline event`);

      continue;
    }

    const ipWithPad = ip.padEnd(15, " ");
    const timestamp = toTimestamp(time);
    const tag = pessoa ? "<BLOF>" : "<HINI>";

    const message = `${tag}${pessoaId}@${ipWithPad}@0@0@${timestamp}@1`;

    socket.sendMessageToAll(message);
  }
}

export default {
  create,
};
