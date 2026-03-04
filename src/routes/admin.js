// src/routes/admin.js
const express = require('express');
const { requireAuth, requireRole } = require('../middleware/auth');
const { User } = require('../models');
const router = express.Router();

const dashboardController = require('../controllers/dashboardController');

// =============================================
// MIDDLEWARE: BLOQUEAR passenger_admin e passenger_editor
// =============================================
router.use(requireAuth);

router.use((req, res, next) => {
  const userRole = req.session.user.role;
  
  if (userRole === 'passenger_admin' || userRole === 'passenger_editor') {
    req.flash('error', 'Você não tem permissão para acessar esta área.');
    return res.redirect('/portal-passageiro/admin/dashboard');
  }
  
  const allowedRoles = ['admin', 'super_admin', 'editor'];
  if (!allowedRoles.includes(userRole)) {
    req.flash('error', 'Você não tem permissão para acessar o painel administrativo');
    return res.redirect('/');
  }
  
  next();
});

// =============================================
// ROTAS DO DASHBOARD
// =============================================

router.get('/', (req, res) => {
  res.redirect('/admin/dashboard');
});

router.get('/dashboard', dashboardController.dashboard);

router.get('/contacts/api/unread-count', dashboardController.getUnreadCount);

// =============================================
// GESTÃO DE UTILIZADORES
// =============================================

router.get('/users', requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']]
    });

    res.render('admin/users/index', {
      title: 'Gestão de Utilizadores',
      users,
      currentPage: 'users',
      user: req.session.user,
      messages: req.flash(),
      layout: 'layouts/admin'
    });
  } catch (error) {
    console.error('Erro ao carregar utilizadores:', error);
    req.flash('error', 'Erro ao carregar utilizadores');
    res.redirect('/admin/dashboard');
  }
});

router.get('/users/create', requireRole(['admin', 'super_admin']), (req, res) => {
  res.render('admin/users/create', {
    title: 'Criar Utilizador',
    currentPage: 'users',
    user: req.session.user,
    messages: req.flash(),
    layout: 'layouts/admin'
  });
});

router.post('/users', requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      req.flash('error', 'Nome, email e password são obrigatórios');
      return res.redirect('/admin/users/create');
    }

    if (password.length < 6) {
      req.flash('error', 'A password deve ter pelo menos 6 caracteres');
      return res.redirect('/admin/users/create');
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      req.flash('error', 'Já existe um utilizador com este email');
      return res.redirect('/admin/users/create');
    }

    await User.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      role: role || 'user'
    });

    req.flash('success', 'Utilizador criado com sucesso!');
    res.redirect('/admin/users');
  } catch (error) {
    console.error('Erro ao criar utilizador:', error);
    req.flash('error', 'Erro ao criar utilizador: ' + error.message);
    res.redirect('/admin/users/create');
  }
});

router.get('/users/:id/edit', requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const editUser = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] }
    });

    if (!editUser) {
      req.flash('error', 'Utilizador não encontrado');
      return res.redirect('/admin/users');
    }

    res.render('admin/users/edit', {
      title: 'Editar Utilizador',
      editUser,
      currentPage: 'users',
      user: req.session.user,
      messages: req.flash(),
      layout: 'layouts/admin'
    });
  } catch (error) {
    console.error('Erro ao carregar utilizador:', error);
    req.flash('error', 'Erro ao carregar utilizador');
    res.redirect('/admin/users');
  }
});

router.post('/users/:id', requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const { name, email, role, password } = req.body;
    const editUser = await User.findByPk(req.params.id);

    if (!editUser) {
      req.flash('error', 'Utilizador não encontrado');
      return res.redirect('/admin/users');
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser && existingUser.id !== editUser.id) {
      req.flash('error', 'Já existe um utilizador com este email');
      return res.redirect(`/admin/users/${editUser.id}/edit`);
    }

    const updateData = { name, email, role };

    if (password && password.length > 0) {
      if (password.length < 6) {
        req.flash('error', 'A password deve ter pelo menos 6 caracteres');
        return res.redirect(`/admin/users/${editUser.id}/edit`);
      }
      updateData.password = password;
    }

    await editUser.update(updateData);

    req.flash('success', 'Utilizador atualizado com sucesso!');
    res.redirect('/admin/users');
  } catch (error) {
    console.error('Erro ao atualizar utilizador:', error);
    req.flash('error', 'Erro ao atualizar utilizador');
    res.redirect(`/admin/users/${req.params.id}/edit`);
  }
});

router.post('/users/:id/delete', requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const editUser = await User.findByPk(req.params.id);

    if (!editUser) {
      req.flash('error', 'Utilizador não encontrado');
      return res.redirect('/admin/users');
    }

    if (editUser.id === req.session.user.id) {
      req.flash('error', 'Não pode excluir a sua própria conta');
      return res.redirect('/admin/users');
    }

    await editUser.destroy();
    req.flash('success', 'Utilizador excluído com sucesso!');
    res.redirect('/admin/users');
  } catch (error) {
    console.error('Erro ao excluir utilizador:', error);
    req.flash('error', 'Erro ao excluir utilizador');
    res.redirect('/admin/users');
  }
});

module.exports = router;