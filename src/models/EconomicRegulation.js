const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const EconomicRegulation = sequelize.define('EconomicRegulation', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  documentNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    field: 'document_number'
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  publicationDate: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'publication_date'
  },
  fileUrl: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'file_url'
  },
  type: {
    type: DataTypes.ENUM(
      'Empresas', 
      'Acordos Aéreos', 
      'Proteção Ambiental', 
      'Estatística', 
      'Defesa do Passageiro', 
      'SIAV'
    ),
    allowNull: false
  },
  // ✅ NOVOS CAMPOS
  year: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Ano (usado para Estatística)'
  },
  period: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Período (trimestre, semestre, etc.)'
  },
  agreementType: {
    type: DataTypes.ENUM(
      'Acordo de Transporte Aéreo',
      'Acordo Aéreo',
      'Memorando de Entendimento',
      'Outro'
    ),
    allowNull: true,
    field: 'agreement_type',
    comment: 'Tipo de acordo (usado para Acordos Aéreos)'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Descrição adicional do documento'
  },
  imageUrl: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'image_url',
    comment: 'URL da imagem (usado para Proteção Ambiental)'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active'
  },
  // ✅ CAMPO ADICIONADO PARA CONSISTÊNCIA COM OUTROS MODELOS
  authorId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'author_id',
    comment: 'ID do autor/criador do documento'
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'created_at'
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'updated_at'
  }
}, {
  tableName: 'economic_regulations',
  timestamps: true,
  underscored: false,
  // ✅ ESCOPO PADRÃO PARA EVITAR PROBLEMAS COM O CAMPO createdBy
  defaultScope: {
    attributes: {
      exclude: ['createdBy'] // EXCLUI QUALQUER REFERÊNCIA AO CAMPO createdBy
    }
  }
});

module.exports = EconomicRegulation;