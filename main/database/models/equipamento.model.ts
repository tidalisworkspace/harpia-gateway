import { DataTypes, Model, Op } from "sequelize";
import database from "..";

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
          ],
        },
      },
    }
  );
}
