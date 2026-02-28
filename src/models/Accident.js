// src/models/Accident.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Accident = sequelize.define('Accident', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  quarter: {
    type: DataTypes.ENUM('I', 'II', 'III', 'IV'),
    allowNull: false,
    defaultValue: 'I',
    validate: {
      notEmpty: { msg: 'O trimestre é obrigatório' },
      isIn: {
        args: [['I', 'II', 'III', 'IV']],
        msg: 'Trimestre inválido. Deve ser I, II, III ou IV'
      }
    }
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
  year: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'O ano é obrigatório' },
      isInt: { msg: 'O ano deve ser um número inteiro' },
      min: {
        args: [1900],
        msg: 'O ano deve ser maior que 1900'
      },
      max: {
        args: [2100],
        msg: 'O ano deve ser menor que 2100'
      }
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  type: {
    type: DataTypes.ENUM('Acidente', 'Incidente'),
    allowNull: false,
    defaultValue: 'Incidente'
  },
  status: {
    type: DataTypes.ENUM('Em Investigação', 'Concluído', 'Arquivado'),
    allowNull: false,
    defaultValue: 'Em Investigação'
  },
  pdfUrl: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  imageUrl: {
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
  tableName: 'accidents',
  timestamps: true,
  underscored: false, // ✅ ADICIONAR
  charset: 'utf8mb4',
  collate: 'utf8mb4_unicode_ci'
});

module.exports = Accident;
