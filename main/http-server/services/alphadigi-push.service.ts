import { differenceInMinutes, format, fromUnixTime } from "date-fns";
import { Dialect, Sequelize } from "sequelize";
import { Fn } from "sequelize/types/utils";
import logger from "../../../shared/logger";
import database from "../../database";
import equipamentoModel from "../../database/models/equipamento.model";
import eventoModel from "../../database/models/evento.model";
import pessoaModel from "../../database/models/pessoa.model";
import veiculoModel from "../../database/models/veiculo.model";
import socketServer from "../../socket-server";
import AlphadigiEvent from "../types/AlphadigiEvent";
import { TipoEvento } from "../types/TipoEvento";

function isIrrelevant(event: AlphadigiEvent) {
  const logId = event.logId;
  const confidence = event.AlarmInfoPlate.result.PlateResult.confidence;

  const irrelevant = confidence < 89;

  if (irrelevant) {
    logger.warn(
      `http-server:controlid-events-service:create:${logId} irrelevant confidence=${confidence}`
    );
  }

  return irrelevant;
}

function toDate(unixTimestamp: number): string {
  return format(fromUnixTime(unixTimestamp), "dd/MM/yyyy");
}

function toHour(unixTimestamp: number): string {
  return format(fromUnixTime(unixTimestamp), "HH:mm:ss");
}

function toTimestamp(unixTimestamp: number): string {
  return `${toDate(unixTimestamp)} ${toHour(unixTimestamp)}`;
}

function getEventType(logId: string, timestamp: number): TipoEvento {
  const dateTime = fromUnixTime(timestamp);
  const now = new Date();

  const minutes = differenceInMinutes(now, dateTime);

  if (minutes > 1) {
    logger.debug(
      `http-server:alphadigi-push-service:get-event-type:${logId} offline event minutes=${minutes} time=${dateTime}`
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
  const event = await eventoModel().findOne({
    attributes: ["pessoaId"],
    where: {
      pessoaId,
      data: useFunction("to_date", data),
      hora: useFunction("to_time", hora),
    },
  });

  const exists = Boolean(event);

  if (exists) {
    logger.info(
      `http-server:alphadigi-push-service:create:${logId} event already exists`
    );
  }

  return exists;
}

async function create(event: AlphadigiEvent): Promise<void> {
  const logId = event.logId;

  if (!event.AlarmInfoPlate) {
    logger.warn(
      `http-server:alphadigi-push-service:create:${logId} AlarmInfoPlate is null`
    );

    return;
  }

  const ip = event.AlarmInfoPlate.ipaddr;

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
      `http-server:alphadigi-push-service:create:${logId} device not found ip=${ip}`
    );
    return;
  }

  if (equipamento.ignorarEvento) {
    logger.warn(
      `http-server:alphadigi-push-service:create:${logId} device ignoring events ip=${ip}`
    );
    return;
  }

  if (isIrrelevant(event)) {
    return;
  }

  const plate = event.AlarmInfoPlate.result.PlateResult.license;

  const VeiculoModel = veiculoModel();
  const PessoaModel = pessoaModel();

  const pessoas = await PessoaModel.findAll({
    attributes: ["id", "departamento", "nomeGrupoHorario", "tipoCadastro"],
    include: {
      model: VeiculoModel,
      attributes: [],
      required: true,
      where: {
        placa: plate,
      },
    },
  });

  if (pessoas.length > 1) {
    socketServer.broadcastPlateError(plate);
    return;
  }

  const pessoa = pessoas.find(Boolean);

  if (!pessoa) {
    logger.warn(
      `http-server:alphadigi-push-service:create:${logId} people not found plate=${plate}`
    );
    return;
  }

  const pessoaId = pessoa.id;

  const timestamp =
    event.AlarmInfoPlate.result.PlateResult.timeStamp.Timeval.sec;

  const data = toDate(timestamp);
  const hora = toHour(timestamp);

  const exists = await checkIfExists(logId, pessoaId, data, hora);

  if (exists) {
    return;
  }

  const dataHora = toTimestamp(timestamp);

  const eventType = getEventType(logId, timestamp);

  await eventoModel().create({
    pessoaId: pessoaId,
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
  });

  if (eventType === "OFF") {
    return;
  }

  const ipWithPad = ip.padEnd(15, " ");

  const message = `<BLOF>${pessoaId}@${ipWithPad}@0@0@${dataHora}@1`;

  socketServer.broadcastMessageAndPlate(message, plate);
}

export default {
  create,
};
