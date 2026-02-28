// src/routes/admin.js
const express = require('express');
const { requireAuth, requireRole } = require('../middleware/auth');
const { User, News, Event, Regulation, EconomicRegulation, Contact } = require('../models');
const upload = require('../config/upload');
const path = require('path');
const router = express.Router();

// =============================================
// IMPORTAR CONTROLLER DO DASHBOARD
// =============================================
const dashboardController = require('../controllers/dashboardController');

// =============================================
// MIDDLEWARE: BLOQUEAR passenger_admin e passenger_editor
// =============================================
router.use(requireAuth);

router.use((req, res, next) => {
  const userRole = req.session.user.role;
  
  // Bloquear roles do portal
  if (userRole === 'passenger_admin' || userRole === 'passenger_editor') {
    console.log(`❌ Acesso negado ao admin web para role: ${userRole}`);
    req.flash('error', 'Você não tem permissão para acessar esta área. Use o Admin do Portal do Passageiro.');
    return res.redirect('/portal-passageiro/admin/dashboard');
  }
  
  // Permitir apenas admin, super_admin, editor
  const allowedRoles = ['admin', 'super_admin', 'editor'];
  if (!allowedRoles.includes(userRole)) {
    console.log(`❌ Acesso negado ao admin web para role: ${userRole}`);
    req.flash('error', 'Você não tem permissão para acessar o painel administrativo');
    return res.redirect('/');
  }
  
  console.log(`✅ Acesso permitido ao admin web para role: ${userRole}`);
  next();
});

// =============================================
// ROTAS DO ADMIN
// =============================================

// ROTA PRINCIPAL DO ADMIN (redireciona para dashboard)
router.get('/', (req, res) => {
    res.redirect('/admin/dashboard');
});

// =============================================
// Dashboard principal - USAR O CONTROLLER
// =============================================
router.get('/dashboard', dashboardController.dashboard);

// =============================================
// API para contactos (auto-refresh)
// =============================================
router.get('/contacts/api/unread-count', dashboardController.getUnreadCount);

// =============================================
// GESTÃO DE NOTÍCIAS
// =============================================

// Página principal
router.get('/news', async (req, res) => {
    try {
        const news = await News.findAll({
            order: [['createdAt', 'DESC']],
            include: [{ model: User, as: 'author', attributes: ['name'] }]
        });

        res.render('admin/news/index', {
            title: 'Gestão de Notícias - IACM',
            currentPage: 'news',
            news,
            layout: 'layouts/admin' // ← ADICIONADO
        });
    } catch (error) {
        console.error('Erro ao carregar notícias:', error);
        req.flash('error', 'Erro ao carregar notícias');
        res.redirect('/admin/dashboard');
    }
});

// Formulário para criar notícia
router.get('/news/create', (req, res) => {
    res.render('admin/news/create', {
        title: 'Criar Notícia - IACM',
        currentPage: 'news',
        layout: 'layouts/admin' // ← ADICIONADO
    });
});

// Processar criação de notícia COM UPLOAD DE IMAGEM
router.post('/news', upload.single('featuredImage'), async (req, res) => {
    try {
        const { title, excerpt, content, isPublished } = req.body;

        // Validação básica
        if (!title || title.trim() === '') {
            req.flash('error', 'O título é obrigatório');
            return res.redirect('/admin/news/create');
        }

        if (!excerpt || excerpt.trim() === '') {
            req.flash('error', 'O resumo é obrigatório');
            return res.redirect('/admin/news/create');
        }

        // Gerar slug baseado no título
        let slug = title
            .toLowerCase()
            .replace(/[^a-z0-9 -]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim();

        // Verificar se o slug já existe
        const existingNews = await News.findOne({ where: { slug } });
        if (existingNews) {
            slug = `${slug}-${Date.now()}`;
        }

        // Processar a imagem enviada
        let featuredImage = '/images/news-default.jpg';
        if (req.file) {
            featuredImage = '/uploads/' + req.file.filename;
        }

        const news = await News.create({
            title: title.trim(),
            slug: slug,
            excerpt: excerpt.substring(0, 200),
            content: content,
            featuredImage: featuredImage,
            isPublished: isPublished === 'on',
            publishedAt: isPublished === 'on' ? new Date() : null,
            authorId: req.session.user.id
        });

        req.flash('success', 'Notícia criada com sucesso!');
        res.redirect('/admin/news');
    } catch (error) {
        console.error('Erro ao criar notícia:', error);

        if (error.name === 'SequelizeValidationError') {
            const messages = error.errors.map(err => err.message).join(', ');
            req.flash('error', `Erro de validação: ${messages}`);
        } else if (error.name === 'SequelizeUniqueConstraintError') {
            req.flash('error', 'Já existe uma notícia com este título/slug');
        } else {
            req.flash('error', 'Erro ao criar notícia');
        }

        res.redirect('/admin/news/create');
    }
});

// Formulário para editar notícia
router.get('/news/:id/edit', async (req, res) => {
    try {
        const news = await News.findByPk(req.params.id);

        if (!news) {
            req.flash('error', 'Notícia não encontrada');
            return res.redirect('/admin/news');
        }

        res.render('admin/news/edit', {
            title: 'Editar Notícia - IACM',
            currentPage: 'news',
            news,
            layout: 'layouts/admin' // ← ADICIONADO
        });
    } catch (error) {
        console.error('Erro ao carregar notícia para edição:', error);
        req.flash('error', 'Erro ao carregar notícia');
        res.redirect('/admin/news');
    }
});

// Processar edição de notícia COM UPLOAD DE IMAGEM
router.post('/news/:id', upload.single('featuredImage'), async (req, res) => {
    try {
        const { title, excerpt, content, isPublished, currentImage } = req.body;
        const news = await News.findByPk(req.params.id);

        if (!news) {
            req.flash('error', 'Notícia não encontrada');
            return res.redirect('/admin/news');
        }

        let updateData = {
            title,
            excerpt: excerpt.substring(0, 200),
            content,
            isPublished: isPublished === 'on',
            publishedAt: isPublished === 'on' ? new Date() : null
        };

        if (title !== news.title) {
            let newSlug = title
                .toLowerCase()
                .replace(/[^a-z0-9 -]/g, '')
                .replace(/\s+/g, '-')
                .replace(/-+/g, '-')
                .trim();

            const existingNews = await News.findOne({ where: { slug: newSlug } });
            if (existingNews && existingNews.id !== news.id) {
                newSlug = `${newSlug}-${Date.now()}`;
            }

            updateData.slug = newSlug;
        }

        if (req.file) {
            updateData.featuredImage = '/uploads/' + req.file.filename;
        } else if (currentImage) {
            updateData.featuredImage = currentImage;
        }

        await news.update(updateData);

        req.flash('success', 'Notícia atualizada com sucesso!');
        res.redirect('/admin/news');
    } catch (error) {
        console.error('Erro ao atualizar notícia:', error);

        if (error.name === 'SequelizeValidationError') {
            const messages = error.errors.map(err => err.message).join(', ');
            req.flash('error', `Erro de validação: ${messages}`);
        } else {
            req.flash('error', 'Erro ao atualizar notícia');
        }

        res.redirect(`/admin/news/${req.params.id}/edit`);
    }
});

// Excluir notícia
router.post('/news/:id/delete', async (req, res) => {
    try {
        const news = await News.findByPk(req.params.id);

        if (!news) {
            req.flash('error', 'Notícia não encontrada');
            return res.redirect('/admin/news');
        }

        await news.destroy();
        req.flash('success', 'Notícia excluída com sucesso!');
        res.redirect('/admin/news');
    } catch (error) {
        console.error('Erro ao excluir notícia:', error);
        req.flash('error', 'Erro ao excluir notícia');
        res.redirect('/admin/news');
    }
});

// =============================================
// GESTÃO DE UTILIZADORES
// =============================================

// Página principal (apenas admin)
router.get('/users', requireRole(['admin', 'super_admin']), async (req, res) => {
    try {
        const users = await User.findAll({
            attributes: { exclude: ['password'] },
            order: [['createdAt', 'DESC']]
        });

        res.render('admin/users/index', {
            title: 'Gestão de Utilizadores',
            users: users,
            currentPage: 'users',
            layout: 'layouts/admin' // ← ADICIONADO
        });
    } catch (error) {
        console.error('Erro ao carregar utilizadores:', error);
        req.flash('error', 'Erro ao carregar utilizadores');
        res.redirect('/admin/dashboard');
    }
});

// Formulário para criar utilizador
router.get('/users/create', requireRole(['admin', 'super_admin']), (req, res) => {
    res.render('admin/users/create', {
        title: 'Criar Utilizador',
        currentPage: 'users',
        layout: 'layouts/admin' // ← ADICIONADO
    });
});

// Processar criação de utilizador
router.post('/users', requireRole(['admin', 'super_admin']), async (req, res) => {
    try {
        console.log('📥 Dados recebidos:', req.body);

        const { name, email, password, role, isActive } = req.body;

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

        const newUser = await User.create({
            name: name.trim(),
            email: email.trim().toLowerCase(),
            password: password,
            role: role || 'user'
        });

        console.log('✅ Novo usuário criado:', newUser.id);

        req.flash('success', 'Utilizador criado com sucesso!');
        res.redirect('/admin/users');

    } catch (error) {
        console.error('❌ Erro ao criar utilizador:', error);

        if (error.name === 'SequelizeValidationError') {
            const messages = error.errors.map(err => err.message).join(', ');
            req.flash('error', `Erro de validação: ${messages}`);
        } else {
            req.flash('error', 'Erro ao criar utilizador: ' + error.message);
        }

        res.redirect('/admin/users/create');
    }
});

// Formulário para editar utilizador
router.get('/users/:id/edit', requireRole(['admin', 'super_admin']), async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id, {
            attributes: { exclude: ['password'] }
        });

        if (!user) {
            req.flash('error', 'Utilizador não encontrado');
            return res.redirect('/admin/users');
        }

        res.render('admin/users/edit', {
            title: 'Editar Utilizador',
            user: user,
            currentPage: 'users',
            layout: 'layouts/admin' // ← ADICIONADO
        });
    } catch (error) {
        console.error('Erro ao carregar utilizador para edição:', error);
        req.flash('error', 'Erro ao carregar utilizador');
        res.redirect('/admin/users');
    }
});

// Processar edição de utilizador
router.post('/users/:id', requireRole(['admin', 'super_admin']), async (req, res) => {
    try {
        const { name, email, role, password } = req.body;
        const user = await User.findByPk(req.params.id);

        if (!user) {
            req.flash('error', 'Utilizador não encontrado');
            return res.redirect('/admin/users');
        }

        const existingUser = await User.findOne({ where: { email } });
        if (existingUser && existingUser.id !== user.id) {
            req.flash('error', 'Já existe um utilizador com este email');
            return res.redirect(`/admin/users/${user.id}/edit`);
        }

        const updateData = {
            name,
            email,
            role
        };

        if (password && password.length > 0) {
            if (password.length < 6) {
                req.flash('error', 'A password deve ter pelo menos 6 caracteres');
                return res.redirect(`/admin/users/${user.id}/edit`);
            }
            updateData.password = password;
        }

        await user.update(updateData);

        req.flash('success', 'Utilizador atualizado com sucesso!');
        res.redirect('/admin/users');
    } catch (error) {
        console.error('Erro ao atualizar utilizador:', error);

        if (error.name === 'SequelizeValidationError') {
            const messages = error.errors.map(err => err.message).join(', ');
            req.flash('error', `Erro de validação: ${messages}`);
        } else {
            req.flash('error', 'Erro ao atualizar utilizador');
        }

        res.redirect(`/admin/users/${req.params.id}/edit`);
    }
});

// Excluir utilizador
router.post('/users/:id/delete', requireRole(['admin', 'super_admin']), async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);

        if (!user) {
            req.flash('error', 'Utilizador não encontrado');
            return res.redirect('/admin/users');
        }

        if (user.id === req.session.user.id) {
            req.flash('error', 'Não pode excluir a sua própria conta');
            return res.redirect('/admin/users');
        }

        await user.destroy();
        req.flash('success', 'Utilizador excluído com sucesso!');
        res.redirect('/admin/users');
    } catch (error) {
        console.error('Erro ao excluir utilizador:', error);
        req.flash('error', 'Erro ao excluir utilizador');
        res.redirect('/admin/users');
    }
});

module.exports = router;