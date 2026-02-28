const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const FAQ = sequelize.define('FAQ', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  category: {
    type: DataTypes.ENUM('geral', 'bagagem', 'documentos', 'checkin', 'voo', 'compensacao', 'reclamacao', 'outro'),
    allowNull: false
  },
  question: {
    type: DataTypes.STRING(500),
    allowNull: false
  },
  answer: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  display_order: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  views: {
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
  tableName: 'passenger_faqs',
  timestamps: true,
  underscored: false
});

module.exports = FAQ;