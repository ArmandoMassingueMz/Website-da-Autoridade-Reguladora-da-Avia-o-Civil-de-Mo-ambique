// scripts/migrate-travel-guides.js
// Execute uma vez com: node scripts/migrate-travel-guides.js

const { sequelize } = require('../src/config/database');
const { QueryInterface, DataTypes } = require('sequelize');

async function migrate() {
  const queryInterface = sequelize.getQueryInterface();

  try {
    await sequelize.authenticate();
    console.log('✅ Ligação à base de dados estabelecida');

    // Verificar se a coluna já existe
    const tableDescription = await queryInterface.describeTable('travel_guides');

    if (!tableDescription.attachment_url) {
      console.log('⏳ A adicionar coluna attachment_url...');
      await queryInterface.addColumn('travel_guides', 'attachment_url', {
        type: DataTypes.STRING(500),
        allowNull: true,
        defaultValue: null,
        after: 'is_published' // posiciona depois de is_published (MySQL)
      });
      console.log('✅ Coluna attachment_url adicionada com sucesso!');
    } else {
      console.log('ℹ️  Coluna attachment_url já existe, nada a fazer.');
    }

    console.log('\n✅ Migração concluída com sucesso!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Erro na migração:', error);
    process.exit(1);
  }
}

migrate();