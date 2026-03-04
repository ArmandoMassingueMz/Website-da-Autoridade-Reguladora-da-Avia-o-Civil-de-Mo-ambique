// routes/news.js
const express = require('express');
const router = express.Router();
const newsController = require('../controllers/newsController');
const { requireAuth, requireRole } = require('../middleware/auth');
const upload = require('../config/upload');

// Listar notícias no admin
router.get('/', requireAuth, requireRole(['admin', 'super_admin', 'editor']), newsController.adminListNews);

// Mostrar form de criar notícia
router.get('/create', requireAuth, requireRole(['admin', 'super_admin', 'editor']), newsController.adminCreateNewsForm);

// Criar notícia (COM UPLOAD DE IMAGEM)
router.post('/',
  requireAuth,
  requireRole(['admin', 'super_admin', 'editor']),
  upload.single('featuredImage'),
  newsController.adminCreateNews
);

// Mostrar form de editar notícia
router.get('/:id/edit', requireAuth, requireRole(['admin', 'super_admin', 'editor']), newsController.adminEditNewsForm);

// Atualizar notícia (COM UPLOAD DE IMAGEM)
router.post('/:id',
  requireAuth,
  requireRole(['admin', 'super_admin', 'editor']),
  upload.single('featuredImage'),
  newsController.adminUpdateNews
);

// Deletar notícia
router.post('/:id/delete', requireAuth, requireRole(['admin', 'super_admin', 'editor']), newsController.adminDeleteNews);

// Toggle publicação (AJAX)
router.post('/:id/toggle-publish', requireAuth, requireRole(['admin', 'super_admin', 'editor']), newsController.adminTogglePublish);

module.exports = router;