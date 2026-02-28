const bcrypt = require('bcryptjs');
const { User } = require('../models');

async function createPortalAdmin() {
  try {
    // Verificar se já existe
    const existing = await User.findOne({
      where: { email: 'portal@iacm.gov.mz' }
    });

    if (existing) {
      console.log('❌ Usuário portal@iacm.gov.mz já existe!');
      console.log('Role atual:', existing.role);
      
      // Atualizar role se necessário
      if (existing.role !== 'passenger_admin') {
        await existing.update({ role: 'passenger_admin' });
        console.log('✅ Role atualizada para passenger_admin');
      }
      
      process.exit(0);
    }

    // Criar novo usuário
    const hashedPassword = await bcrypt.hash('portal123', 10);
    
    const portalAdmin = await User.create({
      name: 'Admin Portal Passageiro',
      email: 'portal@iacm.gov.mz',
      password: hashedPassword,
      role: 'passenger_admin'
    });

    console.log('✅ Usuário criado com sucesso!');
    console.log('📧 Email: portal@iacm.gov.mz');
    console.log('🔑 Senha: portal123');
    console.log('⚠️  ALTERE A SENHA APÓS O PRIMEIRO LOGIN!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  }
}

createPortalAdmin();