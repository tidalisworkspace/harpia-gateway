import { addHours, differenceInMinutes, format, fromUnixTime } from "date-fns";
import { Sequelize } from "sequelize";
import { CARDS_CONTENT_ADD } from "../../../shared/constants/ipc-renderer-channels.constants";
import { IpcResponse } from "../../../shared/ipc/types";
import logger from "../../../shared/logger";
import equipamentoModel from "../../database/models/equipamento.model";
import eventoModel from "../../database/models/evento.model";
import pessoaModel from "../../database/models/pessoa.model";
import ipcMain from "../../ipc-main";
import socketServer from "../../socket-server";
import ControlIdEvent, {
  ObjectChange,
  ObjectChangeValues,
} from "../types/ControlIdEvents";
import { TipoEvento } from "../types/TipoEvento";

function isIrrelevant(objectChange: ObjectChange) {
  return (
    objectChange.object !== "access_logs" && objectChange.type !== "inserted"
  );
}

function hasCardNumber(objectChangeValues: ObjectChangeValues) {
  const cardNumber = objectChangeValues.card_value;
  return cardNumber && cardNumber.length && cardNumber.trim();
}

function toDate(unixTimestamp: string): string {
  return format(fromUnixTime(Number(unixTimestamp)), "dd/MM/yyyy");
}

function toHour(unixTimestamp: string): string {
  return format(addHours(fromUnixTime(Number(unixTimestamp)), 3), "HH:mm:ss");
}

function toTimestamp(unixTimestamp: string): string {
  return `${toDate(unixTimestamp)} ${toHour(unixTimestamp)}`;
}

function getEventType(logId: string, objectChange: ObjectChange): TipoEvento {
  const dateTime = addHours(fromUnixTime(Number(objectChange.values.time)), 3);
  const now = new Date();

  const minutes = differenceInMinutes(now, dateTime);

  if (minutes > 1) {
    logger.debug(
      `http-server:controlid-events-service:get-event-type:${logId} offline event minutes=${minutes} time=${dateTime}`
    );

    return "OFF";
  }

  return "ON";
}

function useStrToDate(str: string, format: string) {
  return Sequelize.fn("STR_TO_DATE", str, format);
}

async function create(event: ControlIdEvent): Promise<void> {
  const { logId, ip } = event;

  const equipamento = await equipamentoModel().findOne({
    attributes: [
      "id",
      "funcaoBotao1",
      "codigo",
      "fabricante",
      "modelo",
      "ignorarEvento",
    ],
    where: { ip },
  });

  if (!equipamento) {
    logger.warn(
      `http-server:controlid-events-service:create:${logId} device not found ip=${ip}`
    );
    return;
  }

  if (equipamento.ignorarEvento) {
    logger.warn(
      `http-server:controlid-events-service:create:${logId} device ignoring events ip=${ip}`
    );
    return;
  }

  for (const objectChange of event.object_changes) {
    const { time } = objectChange.values;

    if (hasCardNumber(objectChange.values)) {
      const cardNumber = objectChange.values.card_value;

      const data = {
        timestamp: toTimestamp(time),
        code: cardNumber,
      };

      const response: IpcResponse = {
        status: "success",
        data,
      };

      ipcMain.sendToRenderer(CARDS_CONTENT_ADD, response);
    }

    if (isIrrelevant(objectChange)) {
      return;
    }

    const eventType = getEventType(event.logId, objectChange);

    const pessoaId = objectChange.values.user_id.padStart(7, "0");

    const pessoa = await pessoaModel().findByPk(pessoaId, {
      attributes: ["id", "departamento", "nomeGrupoHorario", "tipoCadastro"],
    });

    if (!pessoa) {
      logger.warn(
        `http-server:controlid-events-service:create:${logId} people not found id=${pessoaId}`
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
        tipo: eventType,
        codigoEquipamento: equipamento.codigo,
        fabricanteEquipamento: equipamento.fabricante,
        modeloEquipamento: equipamento.modelo,
      };

      await eventoModel().create(evento);
    }

    if (eventType === "OFF") {
      return;
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
