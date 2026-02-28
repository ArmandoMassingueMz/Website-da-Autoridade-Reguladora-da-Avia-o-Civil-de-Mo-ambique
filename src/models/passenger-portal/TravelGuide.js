const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const TravelGuide = sequelize.define('TravelGuide', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  phase: {
    type: DataTypes.ENUM('antes_viagem', 'aeroporto', 'durante_voo', 'destino', 'alfandega'),
    allowNull: false
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  slug: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true
  },
  content: {
    type: DataTypes.TEXT('long'),
    allowNull: false
  },
  icon: {
    type: DataTypes.STRING(50),
    defaultValue: 'fa-plane'
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
  tableName: 'travel_guides',
  timestamps: true,
  underscored: false
});

module.exports = TravelGuide;