const { sequelize } = require('../config/database');
const { Staff } = require('../models');

async function syncStaff() {
  try {
    console.log('🔄 Sincronizando modelo Staff...');
    
    // Criar tabela staff
    await Staff.sync({ alter: true });
    
    console.log('✅ Modelo Staff sincronizado com sucesso!');
    console.log('✅ Tabela "staff" criada/atualizada');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao sincronizar Staff:', error);
    process.exit(1);
  }
}

syncStaff();