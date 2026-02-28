// routes/news.js
const express = require('express');
const router = express.Router();
const newsController = require('../controllers/newsController');
const { requireAuth, requireRole } = require('../middleware/auth');
const upload = require('../config/upload'); // ✅ IMPORTAR MIDDLEWARE DE UPLOAD

// =============================================
// ROTAS ADMIN (PROTEGIDAS)
// =============================================

// Listar notícias no admin
router.get('/', requireAuth, requireRole('admin'), newsController.adminListNews);

// Mostrar form de criar notícia
router.get('/create', requireAuth, requireRole('admin'), newsController.adminCreateNewsForm);

// Criar notícia (COM UPLOAD DE IMAGEM) ✅
router.post('/', 
  requireAuth, 
  requireRole('admin'), 
  upload.single('featuredImage'), // ✅ MIDDLEWARE DE UPLOAD
  newsController.adminCreateNews
);

// Mostrar form de editar notícia
router.get('/:id/edit', requireAuth, requireRole('admin'), newsController.adminEditNewsForm);

// Atualizar notícia (COM UPLOAD DE IMAGEM) ✅
router.post('/:id', 
  requireAuth, 
  requireRole('admin'), 
  upload.single('featuredImage'), // ✅ MIDDLEWARE DE UPLOAD
  newsController.adminUpdateNews
);

// Deletar notícia
router.post('/:id/delete', requireAuth, requireRole('admin'), newsController.adminDeleteNews);

// Toggle publicação (AJAX)
router.post('/:id/toggle-publish', requireAuth, requireRole('admin'), newsController.adminTogglePublish);

module.exports = router;