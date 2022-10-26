import { DataTypes, Model, Op } from "sequelize";
import database from "..";
import logger from "../../../shared/logger";
import { Manufacturer } from "../../device-clients/types";

export interface Equipamento extends Model {
  id: number;
  nome: string;
  habilitado: string;
  fabricante: string;
  modelo: string;
  ip: string;
  porta: number;
  funcaoBotao1: string;
  ignorarEvento: boolean;
  codigo: string;
}

const codigos: { manufacturer: Manufacturer; sigla: string }[] = [
  {
    manufacturer: "<HIKV>",
    sigla: "HK",
  },
  {
    manufacturer: "<ITBF>",
    sigla: "IB",
  },
  {
    manufacturer: "<CIBM>",
    sigla: "CI",
  },
];

function getCodigo(manufacturer: string): string {
  const codigo = codigos.find((codigo) => codigo.manufacturer === manufacturer);

  if (!codigo) {
    logger.warn(
      `database:equipamento:get-codigo-evento not found manufacturer=${manufacturer}`
    );

    throw Error(`codigo not found manufacturer=${manufacturer}`);
  }

  return codigo.sigla;
}

export default function equipamentoModel() {
  return database.getConnection().define<Equipamento>(
    "equipamento",
    {
      id: {
        primaryKey: true,
        type: DataTypes.DOUBLE,
        field: "cd_posicao_pos",
      },
      nome: {
        allowNull: false,
        type: DataTypes.STRING(20),
        field: "ds_posicao_pos",
      },
      habilitado: {
        allowNull: false,
        type: DataTypes.STRING(1),
        field: "ic_habilita_pos",
        get() {
          return this.getDataValue("habilitado") === "S";
        },
      },
      fabricante: {
        allowNull: false,
        type: DataTypes.STRING(6),
        field: "cd_modulo_comun_pos",
      },
      modelo: {
        allowNull: false,
        type: DataTypes.STRING(20),
        field: "ds_dispositivo_pos",
      },
      ip: {
        allowNull: false,
        type: DataTypes.STRING(25),
        field: "cd_ip_disp_pos",
      },
      porta: {
        allowNull: false,
        type: DataTypes.DOUBLE,
        field: "cd_porta_pos",
      },
      funcaoBotao1: {
        allowNull: false,
        type: DataTypes.STRING(1),
        field: "ic_func_button1_pos",
      },
      ignorarEvento: {
        allowNull: false,
        type: DataTypes.STRING(1),
        field: "ic_ignora_qq_evt_pos",
        get() {
          return this.getDataValue("ignorarEvento") === "S";
        },
      },
      codigo: {
        type: DataTypes.VIRTUAL,
        get() {
          return getCodigo(this.fabricante);
        },
        set() {
          throw new Error("Do not try to set the `codigo` value!");
        },
      },
    },
    {
      tableName: "posicao",
      defaultScope: {
        where: {
          habilitado: "S",
          [Op.or]: [
            {
              modelo: "HIKV 671",
            },
            {
              modelo: "ITB FACE1",
            },
            {
              modelo: "ID FACE G",
            },
          ],
        },
      },
    }
  );
}
