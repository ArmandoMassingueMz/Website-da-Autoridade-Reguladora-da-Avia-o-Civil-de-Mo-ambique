const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const PassengerRight = sequelize.define('PassengerRight', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  category: {
    type: DataTypes.ENUM('atraso', 'cancelamento', 'recusa_embarque', 'bagagem', 'deficiencia', 'reembolso', 'outro'),
    allowNull: false
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  content: {
    type: DataTypes.TEXT('long'),
    allowNull: false
  },
  compensation_info: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  legal_basis: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  icon: {
    type: DataTypes.STRING(50),
    defaultValue: 'fa-info-circle'
  },
  display_order: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  is_published: {
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
  tableName: 'passenger_rights',
  timestamps: true,
  underscored: false
});

module.exports = PassengerRight;