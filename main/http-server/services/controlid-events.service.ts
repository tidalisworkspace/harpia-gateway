import { addHours, differenceInMinutes, format, fromUnixTime } from "date-fns";
import { Dialect, Sequelize } from "sequelize";
import { Fn } from "sequelize/types/utils";
import { CARDS_CONTENT_ADD } from "../../../shared/constants/ipc-renderer-channels.constants";
import { IpcResponse } from "../../../shared/ipc/types";
import logger from "../../../shared/logger";
import database from "../../database";
import equipamentoModel from "../../database/models/equipamento.model";
import eventoModel from "../../database/models/evento.model";
import pessoaModel from "../../database/models/pessoa.model";
import { ControlidClient } from "../../device-clients/controlid.client";
import ipcMain from "../../ipc-main";
import socketServer from "../../socket-server";
import ControlIdEvent, {
  ObjectChange,
  ObjectChangeValues,
} from "../types/ControlIdEvents";
import { TipoEvento } from "../types/TipoEvento";

function isIrrelevantChange(logId: string, objectChange: ObjectChange) {
  const { object, type } = objectChange;
  const irrelevant = object !== "access_logs" || type !== "inserted";

  if (irrelevant) {
    logger.warn(
      `http-server:controlid-events-service:create:${logId} irrelevant change object=${object} type=${type}`
    );
  }

  return irrelevant;
}

function isIrrelevantValues(logId: string, values: ObjectChangeValues) {
  const { event } = values;

  const irrelevant = !event || !(event == "6" || event == "7");

  if (irrelevant) {
    logger.warn(
      `http-server:controlid-events-service:create:${logId} irrelevant values event=${event}`
    );
  }

  return irrelevant;
}

function hasCardNumber(logId: string, objectChangeValues: ObjectChangeValues) {
  const hasCardNumber =
    objectChangeValues &&
    objectChangeValues.card_value &&
    objectChangeValues.card_value.trim();

  if (!hasCardNumber) {
    logger.debug(
      `http-server:controlid-events-service:get-event-type:${logId} card number not found`
    );
  }

  return hasCardNumber;
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

type SqlFunction = (value: string) => Fn;

interface SqlFunctionCreator {
  name: string;
  dialect: Dialect;
  create: SqlFunction;
}

const sqlFunctionCreators: SqlFunctionCreator[] = [
  {
    name: "to_date",
    dialect: "mysql",
    create: (value) => Sequelize.fn("STR_TO_DATE", value, "%d/%m/%Y"),
  },
  {
    name: "to_time",
    dialect: "mysql",
    create: (value) =>
      Sequelize.fn("STR_TO_DATE", `30/12/1899 ${value}`, "%d/%m/%Y %H:%i:%S"),
  },
  {
    name: "to_timestamp",
    dialect: "mysql",
    create: (value) => Sequelize.fn("STR_TO_DATE", value, "%d/%m/%Y %H:%i:%S"),
  },
  {
    name: "to_date",
    dialect: "postgres",
    create: (value) => Sequelize.fn("TO_DATE", value, "DD/MM/YYYY"),
  },
  {
    name: "to_time",
    dialect: "postgres",
    create: (value) =>
      Sequelize.fn(
        "TO_TIMESTAMP",
        `30/12/1899 ${value}`,
        "DD/MM/YYYY HH24:MI:SS"
      ),
  },
  {
    name: "to_timestamp",
    dialect: "postgres",
    create: (value) =>
      Sequelize.fn("TO_TIMESTAMP", value, "DD/MM/YYYY HH24:MI:SS"),
  },
];

function withName(name: string) {
  return (sqlFunctionCreator: SqlFunctionCreator) =>
    sqlFunctionCreator.name === name &&
    sqlFunctionCreator.dialect === database.getDialect();
}

function useFunction(name: string, value: string) {
  const sqlFunctionCreator = sqlFunctionCreators.find(withName(name));

  if (!sqlFunctionCreator) {
    logger.debug(
      `http-server:controlid-events-service:use-function sql function not found name=${name}`
    );

    throw Error("sql function not found");
  }

  return sqlFunctionCreator.create(value);
}

async function checkIfExists(
  logId: string,
  pessoaId: string,
  data: string,
  hora: string
): Promise<boolean> {
  const evento = await eventoModel().findOne({
    attributes: ["pessoaId"],
    where: {
      pessoaId,
      data: useFunction("to_date", data),
      hora: useFunction("to_time", hora),
    },
  });

  const exists = Boolean(evento);

  if (exists) {
    logger.info(
      `http-server:controlid-events-service:create:${logId} event already exists`
    );
  }

  return exists;
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
      "porta",
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
    if (hasCardNumber(logId, objectChange.values)) {
      const cardNumber = objectChange.values.card_value;

      const data = {
        timestamp: toTimestamp(objectChange.values.time),
        code: cardNumber,
      };

      const response: IpcResponse = {
        status: "success",
        data,
      };

      ipcMain.sendToRenderer(CARDS_CONTENT_ADD, response);
    }

    if (isIrrelevantChange(logId, objectChange)) {
      return;
    }

    if (isIrrelevantValues(logId, objectChange.values)) {
      return;
    }

    const pessoaId = objectChange.values.user_id.toString().padStart(7, "0");

    const pessoa = await pessoaModel().findByPk(pessoaId, {
      attributes: ["id", "departamento", "nomeGrupoHorario", "tipoCadastro"],
    });

    if (!pessoa) {
      logger.warn(
        `http-server:controlid-events-service:create:${logId} people not found id=${pessoaId}`
      );
    }

    const { time } = objectChange.values;

    const data = toDate(time);
    const hora = toHour(time);

    const exists = await checkIfExists(logId, pessoaId, data, hora);

    if (exists) {
      return;
    }

    const dataHora = toTimestamp(time);

    const eventType = getEventType(event.logId, objectChange);

    if (pessoa) {
      const evento = {
        pessoaId: pessoa.id,
        data: useFunction("to_date", data),
        hora: useFunction("to_time", hora),
        dataHora: useFunction("to_timestamp", dataHora),
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

    const client = await new ControlidClient().init(ip, equipamento.porta);

    const ids = event.object_changes.map((change) => change.values.id);

    if (eventType === "OFF") {
      await client.deleteEvents({ ids });
      return;
    }

    const ipWithPad = ip.padEnd(15, " ");
    const tag = pessoa ? "<BLOF>" : "<HINI>";

    const message = `${tag}${pessoaId}@${ipWithPad}@0@0@${dataHora}@1`;

    socketServer.broadcast(message);

    await client.deleteEvents({ ids });
  }
}

export default {
  create,
};
