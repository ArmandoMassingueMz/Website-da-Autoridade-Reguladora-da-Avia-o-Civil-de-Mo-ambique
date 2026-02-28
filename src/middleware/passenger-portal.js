// src/middleware/passenger-portal.js

/**
 * Middleware de autenticação para o Portal do Passageiro
 * Verifica se o usuário tem permissão para acessar áreas administrativas
 */

const isPassengerAdmin = (req, res, next) => {
    // Verificar se está autenticado
    if (!req.isAuthenticated()) {
      req.flash('error', 'Por favor, faça login para acessar esta área');
      return res.redirect('/auth/login?redirect=/portal-passageiro/admin/dashboard');
    }
  
    // Verificar se tem role adequado
    const allowedRoles = ['passenger_admin', 'passenger_editor', 'admin'];
    
    if (!allowedRoles.includes(req.user.role)) {
      req.flash('error', 'Você não tem permissão para acessar esta área');
      return res.redirect('/portal-passageiro');
    }
  
    next();
  };
  
  const isPassengerEditor = (req, res, next) => {
    if (!req.isAuthenticated()) {
      req.flash('error', 'Por favor, faça login');
      return res.redirect('/auth/login?redirect=/portal-passageiro/admin/dashboard');
    }
  
    const allowedRoles = ['passenger_admin', 'passenger_editor', 'admin'];
    
    if (!allowedRoles.includes(req.user.role)) {
      req.flash('error', 'Você não tem permissão para editar conteúdo');
      return res.redirect('/portal-passageiro');
    }
  
    next();
  };
  
  module.exports = {
    isPassengerAdmin,
    isPassengerEditor
  };