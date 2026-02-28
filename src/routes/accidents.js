// src/routes/accidents.js
const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const accidentController = require('../controllers/accidentController');
const uploadAccidents = require('../config/uploadAccidents');

// Middleware para todas as rotas
router.use(requireAuth);

// =============================================
// ROTAS ADMIN - ACIDENTES/INCIDENTES
// =============================================

// Listar todos
router.get('/', accidentController.index);

// Formulário de criação
router.get('/create', accidentController.create);

// Processar criação (com upload de PDF e imagem)
router.post('/', uploadAccidents.fields([
  { name: 'pdfFile', maxCount: 1 },
  { name: 'imageFile', maxCount: 1 }
]), accidentController.store);

// Formulário de edição
router.get('/:id/edit', accidentController.edit);

// Processar edição (com upload de PDF e imagem)
router.post('/:id', uploadAccidents.fields([
  { name: 'pdfFile', maxCount: 1 },
  { name: 'imageFile', maxCount: 1 }
]), accidentController.update);

// Excluir
router.post('/:id/delete', accidentController.destroy);

module.exports = router;