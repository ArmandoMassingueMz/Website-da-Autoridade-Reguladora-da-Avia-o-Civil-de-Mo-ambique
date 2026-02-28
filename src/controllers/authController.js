const bcrypt = require('bcrypt');
const User = require('../models/User');

exports.showLogin = (req, res) => {
  res.render('auth/login', { 
    title: 'Login',
    redirect: req.query.redirect || null
  });
};

exports.postLogin = async (req, res) => {
  let { email, password } = req.body;
  
  email = (email || '').trim();
  password = (password || '').trim();

  try {
    console.log(`🔐 Tentativa de login: ${email}`);

    const user = await User.findOne({ where: { email } });

    if (!user) {
      console.log('❌ Utilizador não encontrado');
      req.flash('error', 'Credenciais inválidas');
      return res.redirect('/auth/login');
    }

    console.log(`✅ Usuário encontrado: ${user.email}`);
    console.log(`📋 Role do usuário NO BANCO: "${user.role}"`);

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      console.log('❌ Password inválida');
      req.flash('error', 'Password incorreta');
      return res.redirect('/auth/login');
    }

    // =====================================
    // LOGIN BEM-SUCEDIDO → CRIAR SESSÃO
    // =====================================
    req.session.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    };

    console.log('✅ Login bem-sucedido!');
    console.log('📍 Sessão criada:', JSON.stringify(req.session.user, null, 2));
    console.log(`🔀 Iniciando verificação de redirecionamento...`);
    console.log(`   Role a verificar: "${user.role}"`);
    console.log(`   Tipo do role: ${typeof user.role}`);

    // =====================================
    // REDIRECIONAMENTO BASEADO NO ROLE
    // =====================================
    
    // PRIORIDADE 1: Portal do Passageiro
    console.log(`🧪 Teste 1: user.role === 'passenger_admin' → ${user.role === 'passenger_admin'}`);
    console.log(`🧪 Teste 2: user.role === 'passenger_editor' → ${user.role === 'passenger_editor'}`);
    
    if (user.role === 'passenger_admin' || user.role === 'passenger_editor') {
      console.log('🛫 ✅ CONDIÇÃO ATENDIDA! Redirecionando para Portal do Passageiro Admin');
      console.log('🎯 URL de destino: /portal-passageiro/admin/dashboard');
      req.flash('success', `Bem-vindo ao Portal do Passageiro, ${user.name}!`);
      return res.redirect('/portal-passageiro/admin/dashboard');
    }

    // PRIORIDADE 2: Administração geral
    console.log(`🧪 Teste 3: Verificando admin geral...`);
    if (user.role === 'admin' || user.role === 'super_admin' || user.role === 'editor') {
      console.log('🔧 ✅ Admin geral detectado. Redirecionando para /admin/dashboard');
      req.flash('success', `Bem-vindo, ${user.name}!`);
      return res.redirect('/admin/dashboard');
    }

    // PRIORIDADE 3: Utilizador normal
    console.log('👤 Nenhuma condição atendida. Redirecionando para home');
    req.flash('success', `Bem-vindo, ${user.name}!`);
    return res.redirect('/');

  } catch (error) {
    console.error('❌ Erro no login:', error);
    req.flash('error', 'Ocorreu um erro durante o login');
    return res.redirect('/auth/login');
  }
};

exports.logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Erro ao fazer logout:', err);
    }
    res.redirect('/');
  });
};
