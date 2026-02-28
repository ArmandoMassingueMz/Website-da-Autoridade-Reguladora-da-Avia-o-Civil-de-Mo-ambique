const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Form = sequelize.define('Form', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  formNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    field: 'form_number'
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  category: {
    type: DataTypes.ENUM('Notificação', 'Reporte de Ocorrência', 'Outro'),
    defaultValue: 'Notificação'
  },
  pdfUrl: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'pdf_url'
  },
  fileSize: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'file_size'
  },
  language: {
    type: DataTypes.ENUM('Português', 'Inglês', 'Ambos'),
    defaultValue: 'Português'
  },
  version: {
    type: DataTypes.STRING,
    defaultValue: '1.0'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active'
  },
  isPublished: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_published'
  },
  downloadCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'download_count'
  },
  publicationDate: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'publication_date'
  },
  authorId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'author_id'
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'created_at'
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'updated_at'
  }
}, {
  tableName: 'forms',
  timestamps: true,
  underscored: true
});

module.exports = Form;