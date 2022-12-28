import { DataTypes, Model } from "sequelize";
import database from "..";
import veiculoModel, { Veiculo } from "./veiculo.model";

export interface Pessoa extends Model {
  id: string;
  nome: string;
  departamento: string;
  nomeGrupoHorario: string;
  tipoCadastro: string;
  veiculo: Veiculo;
}

let veiculo;

export default function pessoaModel() {
  const model = database.getConnection().define<Pessoa>("pessoa", {
    id: {
      primaryKey: true,
      type: DataTypes.STRING(15),
      field: "cd_pessoa_pes",
    },
    nome: {
      allowNull: false,
      type: DataTypes.STRING(40),
      field: "ds_nome_pes",
    },
    departamento: {
      allowNull: false,
      type: DataTypes.STRING(10),
      field: "cd_depto_pes",
    },
    nomeGrupoHorario: {
      allowNull: false,
      type: DataTypes.STRING(5),
      field: "cd_grupo_hr_pes",
    },
    tipoCadastro: {
      allowNull: false,
      type: DataTypes.STRING(1),
      field: "ic_cadastro_pes",
    },
  });

  if (!veiculo) {
    veiculo = veiculoModel();
  }

  model.hasMany(veiculo);

  return model;
}
