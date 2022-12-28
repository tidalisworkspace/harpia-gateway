import { DataTypes, Model } from "sequelize";
import database from "..";
import pessoaModel from "./pessoa.model";

export interface Veiculo extends Model {
  placa: string;
}

export default function veiculoModel() {
  return database.getConnection().define<Veiculo>("veiculo", {
    placa: {
      primaryKey: true,
      type: DataTypes.STRING,
      field: "cd_placa_car",
    },
    pessoaId: {
      allowNull: false,
      type: DataTypes.STRING,
      field: "cd_pessoa_car",
    },
  });
}
