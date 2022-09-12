import { DataTypes, Model } from "sequelize";
import connection from "../connection";

export interface Parametro extends Model {
  id: number;
  caminho: string;
  portaSocket: number;
  portaHttp: number;
  usuarioHikvision: string;
  senhaHikvision: string;
  usuarioIntelbras: string;
  senhaIntelbras: string;
}

export default function parametroModel() {
  return connection.getSequelize().define<Parametro>(
    "parametro",
    {
      id: {
        primaryKey: true,
        type: DataTypes.BIGINT,
        field: "cd_parametro_par",
      },
      caminho: {
        allowNull: false,
        type: DataTypes.STRING(50),
        field: "cd_path_itlx_in_par",
      },
      portaSocket: {
        allowNull: false,
        type: DataTypes.DOUBLE,
        field: "cd_porta_hik_par",
      },
      portaHttp: {
        allowNull: false,
        type: DataTypes.DOUBLE,
        field: "cd_porta_http_par"
      },
      usuarioHikvision: {
        allowNull: false,
        type: DataTypes.STRING(15),
        field: "cd_usuario_hik_par",
      },
      senhaHikvision: {
        allowNull: false,
        type: DataTypes.STRING(15),
        field: "cd_senha_hik_par",
      },
      usuarioIntelbras: {
        allowNull: false,
        type: DataTypes.STRING(15),
        field: "cd_usuario_int_par",
      },
      senhaIntelbras: {
        allowNull: false,
        type: DataTypes.STRING(15),
        field: "cd_senha_int_par",
      },
    },
    {
      defaultScope: {
        where: {
          id: 1,
        },
      },
    }
  );
}
