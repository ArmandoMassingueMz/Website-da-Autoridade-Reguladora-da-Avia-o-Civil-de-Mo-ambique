const express = require('express');
const router = express.Router();
const { 
  requireAuth, 
  requireRole, 
  canEditNews, 
  canDeleteNews, 
  preventSelfDeletion,
  activityLogger 
} = require('../middleware/auth');
const dashboardController = require('../controllers/dashboardController');

// =============================================
// ROTA PRINCIPAL DO ADMIN - REDIRECIONA PARA DASHBOARD
// =============================================
router.get('/', 
  requireAuth, 
  (req, res) => {
    res.redirect('/admin/dashboard');
  }
);

// =============================================
// DASHBOARD - ROTA PRINCIPAL
// =============================================
router.get('/dashboard', 
  requireAuth, 
  activityLogger('Acessou dashboard'),
  dashboardController.dashboard
);

// =============================================
// API PARA CONTADOR DE NÃO LIDOS
// =============================================
router.get('/api/unread-contacts', 
  requireAuth,
  dashboardController.getUnreadCount
);

// =============================================
// ROTAS DE GESTÃO DE USUÁRIOS (APENAS ADMIN)
// =============================================
router.get('/users', 
  requireAuth, 
  requireRole(['admin', 'super_admin']),
  activityLogger('Acessou gestão de usuários'),
  async (req, res) => {
    try {
      const { User } = require('../models');
      const users = await User.findAll({
        order: [['createdAt', 'DESC']]
      });

      res.render('admin/users/list', {
        title: 'Gerenciar Usuários',
        currentPage: 'users',
        users,
        layout: 'layouts/admin'
      });
    } catch (error) {
      console.error('Erro ao listar usuários:', error);
      req.flash('error', 'Erro ao carregar usuários');
      res.redirect('/admin/dashboard');
    }
  }
);

router.get('/users/create', 
  requireAuth, 
  requireRole(['admin', 'super_admin']),
  activityLogger('Acessou criação de usuário'),
  (req, res) => {
    res.render('admin/users/form', {
      title: 'Novo Usuário',
      currentPage: 'users',
      user: null,
      layout: 'layouts/admin'
    });
  }
);

router.post('/users', 
  requireAuth, 
  requireRole(['admin', 'super_admin']),
  activityLogger('Criou novo usuário'),
  async (req, res) => {
    try {
      const { User } = require('../models');
      const { name, email, password, role } = req.body;

      // Validação básica
      if (!name || !email || !password || !role) {
        req.flash('error', 'Todos os campos são obrigatórios');
        return res.redirect('/admin/users/create');
      }

      // Verificar se email já existe
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        req.flash('error', 'Email já está em uso');
        return res.redirect('/admin/users/create');
      }

      // Criar usuário
      await User.create({ name, email, password, role });

      req.flash('success', 'Usuário criado com sucesso!');
      res.redirect('/admin/users');
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      req.flash('error', 'Erro ao criar usuário');
      res.redirect('/admin/users/create');
    }
  }
);

router.get('/users/:id/edit', 
  requireAuth, 
  requireRole(['admin', 'super_admin']),
  activityLogger('Acessou edição de usuário'),
  async (req, res) => {
    try {
      const { User } = require('../models');
      const user = await User.findByPk(req.params.id);

      if (!user) {
        req.flash('error', 'Usuário não encontrado');
        return res.redirect('/admin/users');
      }

      res.render('admin/users/form', {
        title: 'Editar Usuário',
        currentPage: 'users',
        user,
        layout: 'layouts/admin'
      });
    } catch (error) {
      console.error('Erro ao carregar usuário:', error);
      req.flash('error', 'Erro ao carregar usuário');
      res.redirect('/admin/users');
    }
  }
);

router.post('/users/:id', 
  requireAuth, 
  requireRole(['admin', 'super_admin']),
  activityLogger('Editou usuário'),
  async (req, res) => {
    try {
      const { User } = require('../models');
      const user = await User.findByPk(req.params.id);

      if (!user) {
        req.flash('error', 'Usuário não encontrado');
        return res.redirect('/admin/users');
      }

      const { name, email, role, password } = req.body;

      // Validação
      if (!name || !email || !role) {
        req.flash('error', 'Nome, email e função são obrigatórios');
        return res.redirect(`/admin/users/${req.params.id}/edit`);
      }

      // Verificar se email já está em uso por outro usuário
      const existingUser = await User.findOne({
        where: { 
          email,
          id: { [require('sequelize').Op.ne]: req.params.id }
        }
      });

      if (existingUser) {
        req.flash('error', 'Email já está em uso por outro usuário');
        return res.redirect(`/admin/users/${req.params.id}/edit`);
      }

      // Atualizar dados
      const updateData = { name, email, role };
      
      // Só atualiza senha se foi fornecida
      if (password && password.trim() !== '') {
        updateData.password = password;
      }

      await user.update(updateData);

      req.flash('success', 'Usuário atualizado com sucesso!');
      res.redirect('/admin/users');
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      req.flash('error', 'Erro ao atualizar usuário');
      res.redirect(`/admin/users/${req.params.id}/edit`);
    }
  }
);

router.post('/users/:id/delete', 
  requireAuth, 
  requireRole(['admin', 'super_admin']),
  preventSelfDeletion,
  activityLogger('Excluiu usuário'),
  async (req, res) => {
    try {
      const { User } = require('../models');
      const user = await User.findByPk(req.params.id);

      if (!user) {
        req.flash('error', 'Usuário não encontrado');
        return res.redirect('/admin/users');
      }

      await user.destroy();

      req.flash('success', 'Usuário excluído com sucesso!');
      res.redirect('/admin/users');
    } catch (error) {
      console.error('Erro ao excluir usuário:', error);
      req.flash('error', 'Erro ao excluir usuário');
      res.redirect('/admin/users');
    }
  }
);

module.exports = router;