const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME || 'iacm_db',
  process.env.DB_USER || 'root', 
  process.env.DB_PASS || '',
  {
    host: process.env.DB_HOST || 'localhost',
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    // ✅ FORÇAR underscored: false GLOBALMENTE
    define: {
      underscored: false,
      freezeTableName: true,
      timestamps: true,
      // ✅ ADICIONAR estas opções
      createdAt: 'createdAt',
      updatedAt: 'updatedAt'
    },
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

// Testar conexão
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexão com MySQL estabelecida com sucesso!');
    
    // ✅ DESATIVAR sync completamente
    console.log('✅ Modelos carregados (sync desativado)!');
    
  } catch (error) {
    console.error('❌ Erro ao conectar com MySQL:', error);
    process.exit(1);
  }
};

module.exports = { sequelize, testConnection };