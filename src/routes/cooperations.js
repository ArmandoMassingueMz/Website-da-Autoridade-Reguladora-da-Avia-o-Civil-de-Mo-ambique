// src/routes/cooperations.js
const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const cooperationController = require('../controllers/cooperationController');
const uploadCooperation = require('../config/uploadCooperation');

// Middleware para todas as rotas
router.use(requireAuth);

// =============================================
// ROTAS ADMIN - COOPERAÇÃO INTERNACIONAL
// =============================================

// Listar todas
router.get('/', cooperationController.index);

// Formulário de criação
router.get('/create', cooperationController.create);

// Processar criação (com upload de PDF)
router.post('/', uploadCooperation.single('documentFile'), cooperationController.store);

// Formulário de edição
router.get('/:id/edit', cooperationController.edit);

// Processar edição (com upload de PDF)
router.post('/:id', uploadCooperation.single('documentFile'), cooperationController.update);

// Excluir
router.post('/:id/delete', cooperationController.destroy);

module.exports = router;