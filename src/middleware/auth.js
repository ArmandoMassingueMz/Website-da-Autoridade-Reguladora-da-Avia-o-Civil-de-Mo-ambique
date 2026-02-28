const User = require('../models/User');

// Middleware para verificar se o utilizador está autenticado
const requireAuth = (req, res, next) => {
  if (!req.session || !req.session.user) {
    req.flash('error', 'Precisa de fazer login para aceder a esta página.');
    return res.redirect('/auth/login');
  }
  next();
};

// Middleware para verificar se o utilizador tem uma das funções permitidas
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.session || !req.session.user) {
      req.flash('error', 'Precisa de fazer login.');
      return res.redirect('/auth/login');
    }

    const userRole = req.session.user.role;

    // Se roles for string, converter para array
    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    
    if (!allowedRoles.includes(userRole)) {
      req.flash('error', 'Não tem permissão para aceder a esta página.');
      
      // Redireciona para o dashboard correspondente ao tipo de utilizador
      if (userRole === 'admin' || userRole === 'super_admin') {
        return res.redirect('/admin');
      } else {
        return res.redirect('/');
      }
    }

    next();
  };
};

// Middleware para verificar se o utilizador é dono do recurso ou admin
const requireOwnershipOrAdmin = (modelName) => {
  return async (req, res, next) => {
    try {
      if (!req.session || !req.session.user) {
        req.flash('error', 'Precisa de fazer login.');
        return res.redirect('/auth/login');
      }

      const user = req.session.user;
      
      // Se for admin ou super_admin, permite sempre
      if (user.role === 'admin' || user.role === 'super_admin') {
        return next();
      }

      // Buscar o recurso
      const models = require('../models');
      const Model = models[modelName];
      
      if (!Model) {
        req.flash('error', 'Modelo não encontrado.');
        return res.redirect('/admin');
      }

      const resource = await Model.findByPk(req.params.id);
      
      if (!resource) {
        req.flash('error', 'Recurso não encontrado.');
        return res.redirect('/admin');
      }

      // Verificar se o utilizador é o autor (para notícias) ou dono do recurso
      if (modelName === 'News') {
        if (resource.authorId !== user.id) {
          req.flash('error', 'Só pode editar as suas próprias notícias.');
          return res.redirect('/admin/news');
        }
      } else if (modelName === 'User') {
        if (resource.id !== user.id) {
          req.flash('error', 'Só pode editar o seu próprio perfil.');
          return res.redirect('/admin');
        }
      }

      next();
    } catch (error) {
      console.error('Erro no middleware de ownership:', error);
      req.flash('error', 'Erro de permissão.');
      res.redirect('/admin');
    }
  };
};

// Middleware para impedir que admin se exclua a si mesmo
const preventSelfDeletion = (req, res, next) => {
  if (!req.session || !req.session.user) {
    req.flash('error', 'Precisa de fazer login.');
    return res.redirect('/auth/login');
  }

  if (req.params.id == req.session.user.id) {
    req.flash('error', 'Não pode excluir a sua própria conta.');
    return res.redirect('/admin/users');
  }

  next();
};

// Middleware para verificar permissões de edição de notícias
const canEditNews = async (req, res, next) => {
  try {
    if (!req.session || !req.session.user) {
      req.flash('error', 'Precisa de fazer login.');
      return res.redirect('/auth/login');
    }

    const user = req.session.user;
    
    // Admin ou super_admin pode editar todas as notícias
    if (user.role === 'admin' || user.role === 'super_admin') {
      return next();
    }

    // Para outros utilizadores, verificar se é o autor
    const { News } = require('../models');
    const news = await News.findByPk(req.params.id);
    
    if (!news) {
      req.flash('error', 'Notícia não encontrada.');
      return res.redirect('/admin/news');
    }

    if (news.authorId !== user.id) {
      req.flash('error', 'Só pode editar as suas próprias notícias.');
      return res.redirect('/admin/news');
    }

    next();
  } catch (error) {
    console.error('Erro no middleware canEditNews:', error);
    req.flash('error', 'Erro de permissão.');
    res.redirect('/admin/news');
  }
};

// Middleware para verificar permissões de exclusão de notícias
const canDeleteNews = async (req, res, next) => {
  try {
    if (!req.session || !req.session.user) {
      req.flash('error', 'Precisa de fazer login.');
      return res.redirect('/auth/login');
    }

    const user = req.session.user;
    
    // Admin ou super_admin pode excluir todas as notícias
    if (user.role === 'admin' || user.role === 'super_admin') {
      return next();
    }

    // Para outros utilizadores, verificar se é o autor
    const { News } = require('../models');
    const news = await News.findByPk(req.params.id);
    
    if (!news) {
      req.flash('error', 'Notícia não encontrada.');
      return res.redirect('/admin/news');
    }

    if (news.authorId !== user.id) {
      req.flash('error', 'Só pode excluir as suas próprias notícias.');
      return res.redirect('/admin/news');
    }

    next();
  } catch (error) {
    console.error('Erro no middleware canDeleteNews:', error);
    req.flash('error', 'Erro de permissão.');
    res.redirect('/admin/news');
  }
};

// Middleware para disponibilizar o utilizador nas views
const userToLocals = (req, res, next) => {
  res.locals.user = req.session ? req.session.user || null : null;
  next();
};

// Middleware para verificar se o utilizador pode publicar notícias
const canPublishNews = (req, res, next) => {
  if (!req.session || !req.session.user) {
    req.flash('error', 'Precisa de fazer login.');
    return res.redirect('/auth/login');
  }

  const user = req.session.user;
  const allowedRoles = ['admin', 'super_admin', 'user', 'editor', 'author'];
  
  if (!allowedRoles.includes(user.role)) {
    req.flash('error', 'Não tem permissão para publicar notícias.');
    return res.redirect('/admin');
  }

  next();
};

// Middleware para logging de atividades
const activityLogger = (action) => {
  return (req, res, next) => {
    if (req.session && req.session.user) {
      console.log(`[ACTIVITY] ${req.session.user.name} (${req.session.user.role}) - ${action} - ${new Date().toISOString()}`);
    }
    next();
  };
};

module.exports = {
  requireAuth,
  requireRole,
  requireOwnershipOrAdmin,
  preventSelfDeletion,
  canEditNews,
  canDeleteNews,
  userToLocals,
  canPublishNews,
  activityLogger
};