import { differenceInMinutes, format, parse } from "date-fns";
import { Sequelize } from "sequelize";
import { CARDS_CONTENT_ADD } from "../../../shared/constants/ipc-renderer-channels.constants";
import { IpcResponse } from "../../../shared/ipc/types";
import logger from "../../../shared/logger";
import equipamentoModel from "../../database/models/equipamento.model";
import eventoModel from "../../database/models/evento.model";
import pessoaModel from "../../database/models/pessoa.model";
import ipcMain from "../../ipc-main";
import socketServer from "../../socket-server";
import IntelbrasEvent, { EventInfo } from "../types/IntelbrasEvent";
import { TipoEvento } from "../types/TipoEvento";

function isIrrelevant(logId: string, eventInfo: EventInfo) {
  const code = eventInfo.Code;
  const userId = eventInfo?.Data?.UserID || "";
  const errorCode = eventInfo?.Data?.ErrorCode || "";

  const irrelevant = code !== "AccessControl" || !userId || !!errorCode;

  if (irrelevant) {
    logger.warn(
      `http-server:intelbras-events-service:create:${logId} irrelevant event code=${code} userId=${userId} errorCode=${errorCode}`
    );
  }

  return irrelevant;
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

function getEventType(event: IntelbrasEvent): TipoEvento {
  const dateTime = fromDateTimeString(event.Time);
  const now = new Date();

  const minutes = differenceInMinutes(now, dateTime);

  if (minutes > 1) {
    logger.debug(
      `http-server:intelbras-events-service:get-event-type:${event.logId} offline event minutes=${minutes} dateTime=${dateTime}`
    );

    return "OFF";
  }

  return "ON";
}

function useStrToDate(str: string, format: string) {
  return Sequelize.fn("STR_TO_DATE", str, format);
}

async function create(event: IntelbrasEvent): Promise<void> {
  const { logId, ip, Time: time } = event;

  const equipamento = await equipamentoModel().findOne({ where: { ip } });

  if (!equipamento) {
    logger.warn(
      `http-server:intelbras-events-service:create:${logId} device not found ip=${ip}`
    );
    return;
  }

  if (equipamento.ignorarEvento) {
    logger.warn(
      `http-server:intelbras-events-service:create:${logId} device ignoring events ip=${ip}`
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

      ipcMain.sendToRenderer(CARDS_CONTENT_ADD, response);
    }

    if (isIrrelevant(logId, eventInfo)) {
      continue;
    }

    const tipoEvento = getEventType(event);

    const pessoaId = eventInfo.Data.UserID;

    const pessoa = await pessoaModel().findByPk(pessoaId);

    if (!pessoa) {
      logger.warn(
        `http-server:intelbras-events-service:create:${logId} people not found id=${pessoaId}`
      );
    }

    if (pessoa) {
      const data = toDate(time);
      const hora = toHour(time);
      const dataHora = toTimestamp(time);

      const evento = {
        pessoaId: pessoa.id,
        data: useStrToDate(data, "%d/%m/%Y"),
        hora: useStrToDate(`30/12/1899 ${hora}`, "%d/%m/%Y %H:%i:%S"),
        dataHora: useStrToDate(dataHora, "%d/%m/%Y %H:%i:%S"),
        departamento: pessoa.departamento,
        nomeGrupoHorario: pessoa.nomeGrupoHorario,
        equipamentoId: equipamento.id,
        tipoCadastroPessoa: pessoa.tipoCadastro,
        sentido: equipamento.funcaoBotao1,
        tipo: tipoEvento,
        codigoEquipamento: "IB",
        fabricanteEquipamento: "<ITBF>",
        modeloEquipamento: equipamento.modelo,
      };

      await eventoModel().create(evento);
    }

    if (tipoEvento === "OFF") {
      continue;
    }

    const ipWithPad = ip.padEnd(15, " ");
    const timestamp = toTimestamp(time);
    const tag = pessoa ? "<BLOF>" : "<HINI>";

    const message = `${tag}${pessoaId}@${ipWithPad}@0@0@${timestamp}@1`;

    socketServer.broadcast(message);
  }
}

export default {
  create,
};
