const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const CompensationRule = sequelize.define('CompensationRule', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  rule_type: {
    type: DataTypes.ENUM('atraso', 'cancelamento', 'recusa_embarque', 'bagagem'),
    allowNull: false
  },
  distance_category: {
    type: DataTypes.ENUM('curta', 'media', 'longa'),
    allowNull: false
  },
  delay_hours: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  compensation_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  currency: {
    type: DataTypes.STRING(10),
    defaultValue: 'MZN'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  conditions: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  legal_reference: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  authorId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'compensation_rules',
  timestamps: true,
  underscored: false
});

module.exports = CompensationRule;