// src/models/InternationalCooperation.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const InternationalCooperation = sequelize.define('InternationalCooperation', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'O título é obrigatório' },
      len: {
        args: [3, 255],
        msg: 'O título deve ter entre 3 e 255 caracteres'
      }
    }
  },
  organization: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'A organização é obrigatória' }
    }
  },
  country: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  date: {
    type: DataTypes.DATE,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'A data é obrigatória' },
      isDate: { msg: 'Data inválida' }
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'A descrição é obrigatória' }
    }
  },
  type: {
    type: DataTypes.ENUM('Acordo', 'Memorando', 'Parceria', 'Convênio', 'Outro'),
    allowNull: false,
    defaultValue: 'Parceria'
  },
  documentUrl: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  isPublished: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  authorId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'international_cooperations',
  timestamps: true,
  underscored: false, // ✅ ADICIONAR
  charset: 'utf8mb4',
  collate: 'utf8mb4_unicode_ci'
});

module.exports = InternationalCooperation;