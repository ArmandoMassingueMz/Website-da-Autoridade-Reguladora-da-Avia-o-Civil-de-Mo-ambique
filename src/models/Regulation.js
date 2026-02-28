const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Regulation = sequelize.define('Regulation', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  type: {
    type: DataTypes.ENUM(
      'MOZCATS',
      'Legislação em Consulta Pública',
      'Directivas Técnicas',
      'Instruções de Serviço',
      'Circulares de Informação Aeronáutica',
      'Diplomas Ministeriais',
      'MOZCAR',
      'Isenções',
      'Circulares Técnicas',
      'Anexos a Convenções',
      'AIC-Internacional',
      'NOTAM',
      'Manuais Técnicos'
    ),
    allowNull: false
  },
  documentNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'document_number' // ✅ MAPEAR para o nome correto no banco
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  publicationDate: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'publication_date' // ✅ MAPEAR para o nome correto no banco
  },
  fileUrl: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'file_url' // ✅ MAPEAR para o nome correto no banco
  },
  isPublished: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_published' // ✅ MAPEAR para o nome correto no banco
  },
  authorId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'author_id', // ✅ MAPEAR para o nome correto no banco
    references: {
      model: 'users',
      key: 'id'
    }
  },
  createdAt: {
    type: DataTypes.DATE,
    field: 'created_at' // ✅ MAPEAR para o nome correto no banco
  },
  updatedAt: {
    type: DataTypes.DATE,
    field: 'updated_at' // ✅ MAPEAR para o nome correto no banco
  }
}, {
  tableName: 'regulations',
  timestamps: true,
  underscored: false
});

module.exports = Regulation;