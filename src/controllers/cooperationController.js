// src/controllers/cooperationController.js
const { InternationalCooperation, User } = require('../models');
const { Op } = require('sequelize');

// =============================================
// LISTAR TODAS AS COOPERAÇÕES (ADMIN)
// =============================================
exports.index = async (req, res) => {
  try {
    const cooperations = await InternationalCooperation.findAll({
      include: [{ model: User, as: 'author', attributes: ['name', 'email'] }],
      order: [['date', 'DESC']]
    });

    res.render('admin/cooperations/index', {
      title: 'Gestão de Cooperação Internacional - IACM',
      currentPage: 'cooperations',
      cooperations
    });
  } catch (error) {
    console.error('Erro ao listar cooperações:', error);
    req.flash('error', 'Erro ao carregar cooperações');
    res.redirect('/admin/dashboard');
  }
};

// =============================================
// FORMULÁRIO DE CRIAÇÃO
// =============================================
exports.create = (req, res) => {
  res.render('admin/cooperations/create', {
    title: 'Registrar Cooperação Internacional - IACM',
    currentPage: 'cooperations'
  });
};

// =============================================
// PROCESSAR CRIAÇÃO
// =============================================
exports.store = async (req, res) => {
  try {
    const { title, organization, country, date, description, type, isPublished } = req.body;

    // Validações
    if (!title || !organization || !date || !description) {
      req.flash('error', 'Título, organização, data e descrição são obrigatórios');
      return res.redirect('/admin/cooperations/create');
    }

    // Processar arquivo PDF se enviado
    let documentUrl = null;
    if (req.file) {
      documentUrl = '/uploads/cooperations/' + req.file.filename;
    }

    const cooperation = await InternationalCooperation.create({
      title: title.trim(),
      organization: organization.trim(),
      country: country?.trim() || null,
      date: new Date(date),
      description: description.trim(),
      type: type || 'Parceria',
      documentUrl,
      isPublished: isPublished === 'on',
      authorId: req.session.user.id
    });

    req.flash('success', 'Cooperação internacional registrada com sucesso!');
    res.redirect('/admin/cooperations');
  } catch (error) {
    console.error('Erro ao criar cooperação:', error);
    
    if (error.name === 'SequelizeValidationError') {
      const messages = error.errors.map(err => err.message).join(', ');
      req.flash('error', `Erro de validação: ${messages}`);
    } else {
      req.flash('error', 'Erro ao registrar cooperação internacional');
    }
    
    res.redirect('/admin/cooperations/create');
  }
};

// =============================================
// FORMULÁRIO DE EDIÇÃO
// =============================================
exports.edit = async (req, res) => {
  try {
    const cooperation = await InternationalCooperation.findByPk(req.params.id);

    if (!cooperation) {
      req.flash('error', 'Cooperação internacional não encontrada');
      return res.redirect('/admin/cooperations');
    }

    res.render('admin/cooperations/edit', {
      title: 'Editar Cooperação Internacional - IACM',
      currentPage: 'cooperations',
      cooperation
    });
  } catch (error) {
    console.error('Erro ao carregar cooperação para edição:', error);
    req.flash('error', 'Erro ao carregar cooperação');
    res.redirect('/admin/cooperations');
  }
};

// =============================================
// PROCESSAR EDIÇÃO
// =============================================
exports.update = async (req, res) => {
  try {
    const { title, organization, country, date, description, type, isPublished } = req.body;
    const cooperation = await InternationalCooperation.findByPk(req.params.id);

    if (!cooperation) {
      req.flash('error', 'Cooperação internacional não encontrada');
      return res.redirect('/admin/cooperations');
    }

    let updateData = {
      title: title.trim(),
      organization: organization.trim(),
      country: country?.trim() || null,
      date: new Date(date),
      description: description.trim(),
      type: type || 'Parceria',
      isPublished: isPublished === 'on'
    };

    // Processar novo arquivo PDF se enviado
    if (req.file) {
      updateData.documentUrl = '/uploads/cooperations/' + req.file.filename;
    }

    await cooperation.update(updateData);

    req.flash('success', 'Cooperação internacional atualizada com sucesso!');
    res.redirect('/admin/cooperations');
  } catch (error) {
    console.error('Erro ao atualizar cooperação:', error);
    req.flash('error', 'Erro ao atualizar cooperação internacional');
    res.redirect(`/admin/cooperations/${req.params.id}/edit`);
  }
};

// =============================================
// EXCLUIR
// =============================================
exports.destroy = async (req, res) => {
  try {
    const cooperation = await InternationalCooperation.findByPk(req.params.id);

    if (!cooperation) {
      req.flash('error', 'Cooperação internacional não encontrada');
      return res.redirect('/admin/cooperations');
    }

    await cooperation.destroy();
    req.flash('success', 'Cooperação internacional excluída com sucesso!');
    res.redirect('/admin/cooperations');
  } catch (error) {
    console.error('Erro ao excluir cooperação:', error);
    req.flash('error', 'Erro ao excluir cooperação internacional');
    res.redirect('/admin/cooperations');
  }
};