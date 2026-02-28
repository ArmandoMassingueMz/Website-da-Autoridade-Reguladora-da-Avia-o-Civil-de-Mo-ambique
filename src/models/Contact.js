// src/models/Contact.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Contact = sequelize.define('Contact', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nome: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Nome é obrigatório' }
    }
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      isEmail: { msg: 'Email inválido' },
      notEmpty: { msg: 'Email é obrigatório' }
    }
  },
  telefone: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  assunto: {
    type: DataTypes.ENUM('servicos', 'informacao', 'reclamacao', 'sugestao', 'outro'),
    allowNull: false,
    defaultValue: 'outro'
  },
  mensagem: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Mensagem é obrigatória' }
    }
  },
  newsletter: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Indica se a mensagem foi lida pelo admin'
  },
  isReplied: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Indica se a mensagem foi respondida'
  },
  status: {
    type: DataTypes.ENUM('novo', 'em_analise', 'respondido', 'arquivado'),
    defaultValue: 'novo',
    comment: 'Status da mensagem'
  },
  adminNotes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Notas internas do administrador'
  },
  ipAddress: {
    type: DataTypes.STRING(45),
    allowNull: true,
    comment: 'IP do remetente'
  },
  userAgent: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: 'User Agent do navegador'
  }
}, {
  tableName: 'contacts',
  timestamps: true,
  underscored: false, // ✅ ADICIONAR
  indexes: [
    { fields: ['email'] },
    { fields: ['assunto'] },
    { fields: ['status'] },
    { fields: ['isRead'] },
    { fields: ['createdAt'] }
  ]
});

// Método para obter estatísticas
Contact.getStats = async function() {
  try {
    const total = await this.count();
    const novos = await this.count({ where: { status: 'novo' } });
    const naoLidos = await this.count({ where: { isRead: false } });
    const respondidos = await this.count({ where: { isReplied: true } });
    
    return {
      total,
      novos,
      naoLidos,
      respondidos,
      pendentes: total - respondidos
    };
  } catch (error) {
    console.error('Erro ao obter estatísticas:', error);
    return null;
  }
};

// Método para marcar como lido
Contact.prototype.markAsRead = async function() {
  this.isRead = true;
  if (this.status === 'novo') {
    this.status = 'em_analise';
  }
  return await this.save();
};

// Método para marcar como respondido
Contact.prototype.markAsReplied = async function(notes = null) {
  this.isReplied = true;
  this.status = 'respondido';
  if (notes) {
    this.adminNotes = notes;
  }
  return await this.save();
};

module.exports = Contact;