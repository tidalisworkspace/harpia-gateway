import { DataTypes, Model } from "sequelize";
import database from "..";

export interface Parametro extends Model {
  id: number;
  caminho: string;
  portaSocket: number;
  ipHttp: string;
  portaHttp: number;
  usuarioHikvision: string;
  senhaHikvision: string;
  usuarioIntelbras: string;
  senhaIntelbras: string;
  usuarioControlId: string;
  senhaControlId: string;
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
      usuarioControlId: {
        allowNull: false,
        type: DataTypes.STRING(15),
        field: "cd_login_ctrlid_par",
      },
      senhaControlId: {
        allowNull: false,
        type: DataTypes.STRING(15),
        field: "cd_senha_ctrlid_par",
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
