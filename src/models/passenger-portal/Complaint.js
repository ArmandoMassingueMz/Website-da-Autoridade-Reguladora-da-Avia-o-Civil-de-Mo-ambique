const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const Complaint = sequelize.define('Complaint', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  complaint_type: {
    type: DataTypes.ENUM('atraso', 'cancelamento', 'bagagem', 'atendimento', 'reembolso', 'outro'),
    allowNull: false
  },
  passenger_name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  passenger_email: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  passenger_phone: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  flight_number: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  flight_date: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  airline: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  attachments: {
    type: DataTypes.JSON,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('pendente', 'em_analise', 'respondida', 'resolvida', 'arquivada'),
    defaultValue: 'pendente'
  },
  priority: {
    type: DataTypes.ENUM('baixa', 'media', 'alta', 'urgente'),
    defaultValue: 'media'
  },
  admin_notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  resolved_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'passenger_complaints',
  timestamps: true,
  underscored: false
});

module.exports = Complaint;