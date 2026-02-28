// src/models/OtherService.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const OtherService = sequelize.define('OtherService', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  serviceName: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: 'Nome do serviço principal'
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: false,
    comment: 'Título do documento/serviço específico'
  },
  subtitle: {
    type: DataTypes.STRING(300),
    allowNull: true,
    comment: 'Subtítulo (opcional)'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Descrição detalhada do serviço'
  },
  pdfUrl: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: 'URL do arquivo PDF'
  },
  icon: {
    type: DataTypes.STRING(50),
    allowNull: true,
    defaultValue: 'fas fa-cog',
    comment: 'Ícone FontAwesome'
  },
  order: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0,
    comment: 'Ordem de exibição'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: 'Se o serviço está ativo e visível'
  },
  displayOrder: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0,
    comment: 'Ordem de exibição alternativa'
  },
  authorId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'ID do autor/criador do serviço'
  }
}, {
  tableName: 'other_services',
  timestamps: true,
  indexes: [
    {
      fields: ['serviceName']
    },
    {
      fields: ['isActive']
    },
    {
      fields: ['displayOrder']
    },
    {
      fields: ['order']
    }
  ]
});



module.exports = OtherService;