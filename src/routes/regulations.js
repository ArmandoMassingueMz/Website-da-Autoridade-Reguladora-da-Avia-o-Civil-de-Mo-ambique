const express = require('express');
const { requireAuth } = require('../middleware/auth');
const Regulation = require('../models/Regulation');
const User = require('../models/User');
const upload = require('../config/uploadRegulations');
const router = express.Router();

// Lista de tipos de regulamentos
const regulationTypes = [
  'MOZCATS',
  'Legislação em Consulta Pública',
  'Directivas Técnicas',
  'Instruções de Serviço',
  'Circulares de Informação Aeronáutica',
  'Diplomas Ministeriais',
  'MOZCAR',
  'Isenções',
  'Circulares Técnicas',
  'Anexos a Convenções',
  'AIC-Internacional',
  'NOTAM',
  'Manuais Técnicos'
];

// =============================================
// LISTAR TODOS OS REGULAMENTOS
// =============================================
router.get('/', requireAuth, async (req, res) => {
  try {
    const regulations = await Regulation.findAll({
      include: [{ model: User, as: 'author', attributes: ['name'] }],
      order: [['createdAt', 'DESC']]
    });

    res.render('admin/regulations/index', {
      title: 'Gestão de Regulamentos - IACM',
      currentPage: 'regulations',
      regulations,
      regulationTypes
    });
  } catch (error) {
    console.error('Erro ao carregar regulamentos:', error);
    req.flash('error', 'Erro ao carregar regulamentos');
    res.redirect('/admin/dashboard');
  }
});

// =============================================
// FORMULÁRIO PARA CRIAR REGULAMENTO
// =============================================
router.get('/create', requireAuth, (req, res) => {
  res.render('admin/regulations/create', {
    title: 'Adicionar Regulamento - IACM',
    currentPage: 'regulations',
    regulationTypes
  });
});

// =============================================
// PROCESSAR CRIAÇÃO DE REGULAMENTO
// =============================================
router.post('/', requireAuth, upload.single('file'), async (req, res) => {
  try {
    const { type, documentNumber, title, publicationDate } = req.body;

    // Validação básica
    if (!type || !documentNumber || !title || !publicationDate) {
      req.flash('error', 'Todos os campos são obrigatórios');
      return res.redirect('/admin/regulations/create');
    }

    if (!req.file) {
      req.flash('error', 'O ficheiro PDF é obrigatório');
      return res.redirect('/admin/regulations/create');
    }

    const regulation = await Regulation.create({
      type,
      documentNumber,
      title,
      publicationDate,
      fileUrl: '/uploads/regulations/' + req.file.filename,
      authorId: req.session.user.id
    });

    req.flash('success', 'Regulamento adicionado com sucesso!');
    res.redirect('/admin/regulations');
  } catch (error) {
    console.error('Erro ao criar regulamento:', error);
    req.flash('error', 'Erro ao criar regulamento');
    res.redirect('/admin/regulations/create');
  }
});

// =============================================
// FORMULÁRIO PARA EDITAR REGULAMENTO
// =============================================
router.get('/:id/edit', requireAuth, async (req, res) => {
  try {
    const regulation = await Regulation.findByPk(req.params.id, {
      include: [{ model: User, as: 'author', attributes: ['name'] }]
    });

    if (!regulation) {
      req.flash('error', 'Regulamento não encontrado');
      return res.redirect('/admin/regulations');
    }

    res.render('admin/regulations/edit', {
      title: 'Editar Regulamento - IACM',
      currentPage: 'regulations',
      regulation,
      regulationTypes
    });
  } catch (error) {
    console.error('Erro ao carregar regulamento para edição:', error);
    req.flash('error', 'Erro ao carregar regulamento');
    res.redirect('/admin/regulations');
  }
});

// =============================================
// PROCESSAR EDIÇÃO DE REGULAMENTO
// =============================================
router.post('/:id', requireAuth, upload.single('file'), async (req, res) => {
  try {
    const { type, documentNumber, title, publicationDate, isPublished } = req.body;
    
    const regulation = await Regulation.findByPk(req.params.id);

    if (!regulation) {
      req.flash('error', 'Regulamento não encontrado');
      return res.redirect('/admin/regulations');
    }

    // Validação básica
    if (!type || !documentNumber || !title || !publicationDate) {
      req.flash('error', 'Todos os campos obrigatórios devem ser preenchidos');
      return res.redirect(`/admin/regulations/${req.params.id}/edit`);
    }

    // Preparar dados para atualização
    const updateData = {
      type,
      documentNumber,
      title,
      publicationDate,
      isPublished: isPublished === 'true' // Converte string para boolean
    };

    // Se um novo arquivo foi enviado, atualizar o fileUrl
    if (req.file) {
      updateData.fileUrl = '/uploads/regulations/' + req.file.filename;
    }

    // Atualizar o regulamento
    await regulation.update(updateData);

    req.flash('success', 'Regulamento atualizado com sucesso!');
    res.redirect('/admin/regulations');
  } catch (error) {
    console.error('Erro ao atualizar regulamento:', error);

    if (error.name === 'SequelizeValidationError') {
      const messages = error.errors.map(err => err.message).join(', ');
      req.flash('error', `Erro de validação: ${messages}`);
    } else {
      req.flash('error', 'Erro ao atualizar regulamento');
    }

    res.redirect(`/admin/regulations/${req.params.id}/edit`);
  }
});

// =============================================
// EXCLUIR REGULAMENTO
// =============================================
router.post('/:id/delete', requireAuth, async (req, res) => {
  try {
    const regulation = await Regulation.findByPk(req.params.id);

    if (!regulation) {
      req.flash('error', 'Regulamento não encontrado');
      return res.redirect('/admin/regulations');
    }

    await regulation.destroy();
    req.flash('success', 'Regulamento excluído com sucesso!');
    res.redirect('/admin/regulations');
  } catch (error) {
    console.error('Erro ao excluir regulamento:', error);
    req.flash('error', 'Erro ao excluir regulamento');
    res.redirect('/admin/regulations');
  }
});

module.exports = router;