import { DataTypes, Model } from "sequelize";
import database from "..";

export interface Parametro extends Model {
  id: number;
  caminho: string;
  portaSocket: number;
  ipHttp: string;
  portaHttp: number;
  usuarioDispositivo: string;
  senhaDispositivo: string;
}

export default function parametroModel() {
  return database.getConnection().define<Parametro>(
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
      ipHttp: {
        allowNull: false,
        type: DataTypes.STRING,
        field: "cd_ip_server_par",
      },
      portaHttp: {
        allowNull: false,
        type: DataTypes.DOUBLE,
        field: "cd_porta_http_par",
      },
      usuarioDispositivo: {
        allowNull: false,
        type: DataTypes.STRING,
        field: "cd_usuario_dispositivo_par",
      },
      senhaDispositivo: {
        allowNull: false,
        type: DataTypes.STRING,
        field: "cd_senha_dispositivo_par",
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
