import { DataTypes, Model } from "sequelize";
import database from "..";

export interface Evento extends Model {
  pessoaId: string;
  data: Date;
  hora: Date;
  dataHora: Date;
  departamento: string;
  nomeGrupoHorario: string;
  equipamentoId: number;
  critica: string;
  tipoCadastroPessoa: string;
  dataCadastro: Date;
  horaCadastro: Date;
  sentido: string;
  tipo: string;
  sitio: number;
  miscelanea: number;
  codigoEquipamento: string;
  fabricanteEquipamento: string;
  provisorio: string;
  modeloEquipamento: string;
  offline: string;
}

export default function eventoModel() {
  return database.getConnection().define<Evento>(
    "evento",
    {
      pessoaId: {
        primaryKey: true,
        allowNull: false,
        type: DataTypes.STRING(15),
        field: "cd_pessoa_pas",
      },
      data: {
        primaryKey: true,
        allowNull: false,
        type: DataTypes.DATE,
        field: "dt_passagem_pas",
      },
      hora: {
        primaryKey: true,
        allowNull: false,
        type: DataTypes.DATE,
        field: "hr_passagem_pas",
      },
      dataHora: {
        allowNull: false,
        type: DataTypes.DATE,
        field: "ts_passagem_pas",
      },
      departamento: {
        allowNull: false,
        type: DataTypes.STRING(10),
        field: "cd_dep_turma_pas",
      },
      nomeGrupoHorario: {
        allowNull: false,
        type: DataTypes.STRING(10),
        field: "cd_horario_pas",
      },
      equipamentoId: {
        allowNull: false,
        type: DataTypes.DOUBLE,
        field: "nr_coletor_pas",
      },
      critica: {
        allowNull: false,
        type: DataTypes.STRING(2),
        field: "cd_critica_pas",
        defaultValue: "OK",
      },
      tipoCadastroPessoa: {
        allowNull: false,
        type: DataTypes.STRING(1),
        field: "cd_tiporeg_pas",
      },
      dataCadastro: {
        allowNull: false,
        type: DataTypes.DATE,
        field: "dt_cadastro_pas",
        defaultValue: DataTypes.NOW,
      },
      horaCadastro: {
        allowNull: false,
        type: DataTypes.DATE,
        field: "hr_cadastro_pas",
        defaultValue: DataTypes.NOW,
      },
      sentido: {
        allowNull: false,
        type: DataTypes.STRING(1),
        field: "ic_entsai_pas",
      },
      tipo: {
        allowNull: false,
        type: DataTypes.STRING(3),
        field: "tp_cadastro_pas",
      },
      sitio: {
        allowNull: false,
        type: DataTypes.DOUBLE,
        field: "cd_sitio_pas",
        defaultValue: 0,
      },
      miscelanea: {
        allowNull: false,
        type: DataTypes.DOUBLE,
        field: "cd_miscelan_pas",
        defaultValue: 0,
      },
      codigoEquipamento: {
        allowNull: false,
        type: DataTypes.STRING(2),
        field: "cd_dispositivo_pas",
      },
      fabricanteEquipamento: {
        allowNull: false,
        type: DataTypes.STRING(6),
        field: "cd_modulo_comun_pas",
      },
      provisorio: {
        allowNull: false,
        type: DataTypes.STRING(1),
        field: "ic_provisorio_pas",
        defaultValue: "N",
      },
      modeloEquipamento: {
        allowNull: false,
        type: DataTypes.STRING(10),
        field: "cd_disp_acionado_pas",
      },
      offline: {
        allowNull: false,
        type: DataTypes.STRING,
        field: "ic_intoffline_pas",
        defaultValue: "",
      },
    },
    { tableName: "passagem" }
  );
}
