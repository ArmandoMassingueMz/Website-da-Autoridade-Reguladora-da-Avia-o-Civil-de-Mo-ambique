const express = require('express');
const bcrypt = require('bcryptjs');
const { User } = require('../models');
const router = express.Router();

// =============================================
// PÁGINA DE LOGIN
// =============================================
router.get('/login', (req, res) => {
  if (req.session.user) {
    // Se já está logado, redirecionar baseado no role
    if (req.session.user.role === 'passenger_admin' || req.session.user.role === 'passenger_editor') {
      return res.redirect('/portal-passageiro/admin/dashboard');
    }
    return res.redirect('/admin/dashboard');
  }

  res.render('auth/login', {
    title: 'Login - IACM',
    layout: 'layouts/auth',
    currentPage: 'login'
  });
});

// =============================================
// PROCESSAR LOGIN
// =============================================
router.post('/login', async (req, res) => {
  try {
    console.log('🔐 Tentativa de login:', req.body.email);
    
    const { email, password } = req.body;

    // Validar inputs
    if (!email || !password) {
      console.log('❌ Email ou password vazios');
      req.flash('error', 'Email e password são obrigatórios');
      return res.redirect('/auth/login');
    }

    // Buscar usuário
    const user = await User.findOne({ where: { email } });
    
    if (!user) {
      console.log('❌ Usuário não encontrado:', email);
      req.flash('error', 'Credenciais inválidas');
      return res.redirect('/auth/login');
    }

    console.log('✅ Usuário encontrado:', user.email);
    console.log('📋 Role do usuário:', user.role);

    // Verificar password
    console.log('🔑 Verificando password...');
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      console.log('❌ Password inválida');
      req.flash('error', 'Credenciais inválidas');
      return res.redirect('/auth/login');
    }

    console.log('✅ Password válida');

    // Limpar role de possíveis espaços
    const cleanRole = user.role.trim();

    // Criar sessão
    req.session.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: cleanRole
    };

    console.log('✅ Sessão criada:', req.session.user);
    req.flash('success', `Bem-vindo de volta, ${user.name}!`);

    // =====================================
    // REDIRECIONAMENTO BASEADO NO ROLE
    // =====================================
    
    // PRIORIDADE 1: Portal do Passageiro
    if (cleanRole === 'passenger_admin' || cleanRole === 'passenger_editor') {
      console.log('🛫 Redirecionando para Portal do Passageiro Admin');
      return res.redirect('/portal-passageiro/admin/dashboard');
    }

    // PRIORIDADE 2: Admin geral
    if (cleanRole === 'admin' || cleanRole === 'super_admin' || cleanRole === 'editor') {
      console.log('🔧 Redirecionando para Admin geral');
      return res.redirect('/admin/dashboard');
    }

    // PRIORIDADE 3: Usuário normal
    console.log('👤 Redirecionando para home');
    return res.redirect('/');

  } catch (error) {
    console.error('❌ Erro no login:', error);
    req.flash('error', 'Erro interno do servidor');
    return res.redirect('/auth/login');
  }
});

// =============================================
// LOGOUT
// =============================================
router.post('/logout', (req, res) => {
  console.log('🚪 Logout iniciado');
  req.session.destroy((err) => {
    if (err) {
      console.error('Erro ao fazer logout:', err);
    }
    console.log('✅ Sessão destruída');
    res.redirect('/');
  });
});

// Rota GET para logout (mais conveniente)
router.get('/logout', (req, res) => {
  console.log('🚪 Logout iniciado (GET)');
  req.session.destroy((err) => {
    if (err) {
      console.error('Erro ao fazer logout:', err);
    }
    console.log('✅ Sessão destruída');
    res.redirect('/');
  });
});

module.exports = router;