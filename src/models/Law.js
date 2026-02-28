// src/models/Law.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database').sequelize;

const Law = sequelize.define('Law', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  ord: {
    type: DataTypes.STRING(10),
    allowNull: false,
    comment: 'Número de ordem (ex: 01, 02, 03...)'
  },
  decreeNumber: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: 'Número do decreto'
  },
  title: {
    type: DataTypes.STRING(500),
    allowNull: false,
    comment: 'Teor/Título do decreto'
  },
  fileUrl: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: 'URL do arquivo PDF/documento'
  },
  publicationDate: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Data de publicação do decreto'
  },
  isPublished: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: 'Se o decreto está publicado no site'
  },
  // ✅ ADICIONAR A COLUNA authorId
  authorId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
    comment: 'ID do usuário que criou o decreto'
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'laws',
  timestamps: true,
  // ✅ ADICIONAR: Configuração para usar underscored corretamente
  underscored: false
});

module.exports = Law;