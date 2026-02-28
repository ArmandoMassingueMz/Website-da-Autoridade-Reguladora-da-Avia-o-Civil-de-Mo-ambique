const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Staff = sequelize.define('Staff', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  department: {
    type: DataTypes.ENUM(
      'Secretaria Geral',
      'Conselho de Administração',
      'Direcção de Serviços de Segurança de Voo',
      'Direcção de Infraestrutura de Navegação Aérea',
      'Direcção de Regulação Económica',
      'Direcção de Administração, Finanças e Recursos Humanos',
      'Gabinete Jurídico e Cooperação Internacional',
      'Gabinete do Presidente do Conselho de Administração'
    ),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'O departamento é obrigatório' }
    }
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'O nome é obrigatório' },
      len: {
        args: [3, 255],
        msg: 'O nome deve ter entre 3 e 255 caracteres'
      }
    }
  },
  position: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'O cargo é obrigatório' }
    }
  },
  phone: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'O contacto é obrigatório' }
    }
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: true,
    validate: {
      isEmail: { msg: 'Email inválido' }
    }
  },
  photo: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  order: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Ordem de exibição dentro do departamento'
  }
}, {
  tableName: 'staff',
  timestamps: true,
  underscored: false, // ✅ ADICIONAR
  charset: 'utf8mb4',
  collate: 'utf8mb4_unicode_ci'
});

module.exports = Staff;