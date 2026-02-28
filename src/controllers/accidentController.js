// src/controllers/accidentController.js
const { Accident, User } = require('../models');
const { Op } = require('sequelize');

// =============================================
// LISTAR TODOS OS ACIDENTES (ADMIN)
// =============================================
exports.index = async (req, res) => {
  try {
    const accidents = await Accident.findAll({
      include: [{ model: User, as: 'author', attributes: ['name', 'email'] }],
      order: [['year', 'DESC'], ['quarter', 'ASC']]
    });

    res.render('admin/accidents/index', {
      title: 'Gestão de Acidentes e Incidentes - IACM',
      currentPage: 'accidents',
      accidents
    });
  } catch (error) {
    console.error('Erro ao listar acidentes:', error);
    req.flash('error', 'Erro ao carregar acidentes');
    res.redirect('/admin/dashboard');
  }
};

// =============================================
// FORMULÁRIO DE CRIAÇÃO
// =============================================
exports.create = (req, res) => {
  res.render('admin/accidents/create', {
    title: 'Registrar Acidente/Incidente - IACM',
    currentPage: 'accidents'
  });
};

// =============================================
// PROCESSAR CRIAÇÃO
// =============================================
exports.store = async (req, res) => {
  try {
    const { quarter, title, year, description, type, status, isPublished } = req.body;

    // Validações
    if (!quarter) {
      req.flash('error', 'O trimestre é obrigatório');
      return res.redirect('/admin/accidents/create');
    }

    if (!title || !year) {
      req.flash('error', 'Trimestre, título e ano são obrigatórios');
      return res.redirect('/admin/accidents/create');
    }

    // Processar arquivos enviados
    let pdfUrl = null;
    let imageUrl = null;

    if (req.files) {
      if (req.files.pdfFile && req.files.pdfFile[0]) {
        pdfUrl = '/uploads/accidents/pdfs/' + req.files.pdfFile[0].filename;
      }
      if (req.files.imageFile && req.files.imageFile[0]) {
        imageUrl = '/uploads/accidents/images/' + req.files.imageFile[0].filename;
      }
    }

    const accident = await Accident.create({
      quarter: quarter.trim(),
      title: title.trim(),
      year: parseInt(year),
      description: description || null,
      type: type || 'Incidente',
      status: status || 'Em Investigação',
      pdfUrl,
      imageUrl,
      isPublished: isPublished === 'on',
      authorId: req.session.user.id
    });

    req.flash('success', 'Acidente/Incidente registrado com sucesso!');
    res.redirect('/admin/accidents');
  } catch (error) {
    console.error('Erro ao criar acidente:', error);
    
    if (error.name === 'SequelizeValidationError') {
      const messages = error.errors.map(err => err.message).join(', ');
      req.flash('error', `Erro de validação: ${messages}`);
    } else {
      req.flash('error', 'Erro ao registrar acidente/incidente');
    }
    
    res.redirect('/admin/accidents/create');
  }
};

// =============================================
// FORMULÁRIO DE EDIÇÃO
// =============================================
exports.edit = async (req, res) => {
  try {
    const accident = await Accident.findByPk(req.params.id);

    if (!accident) {
      req.flash('error', 'Acidente/Incidente não encontrado');
      return res.redirect('/admin/accidents');
    }

    res.render('admin/accidents/edit', {
      title: 'Editar Acidente/Incidente - IACM',
      currentPage: 'accidents',
      accident
    });
  } catch (error) {
    console.error('Erro ao carregar acidente para edição:', error);
    req.flash('error', 'Erro ao carregar acidente');
    res.redirect('/admin/accidents');
  }
};

// =============================================
// PROCESSAR EDIÇÃO
// =============================================
exports.update = async (req, res) => {
  try {
    const { quarter, title, year, description, type, status, isPublished } = req.body;
    const accident = await Accident.findByPk(req.params.id);

    if (!accident) {
      req.flash('error', 'Acidente/Incidente não encontrado');
      return res.redirect('/admin/accidents');
    }

    let updateData = {
      quarter: quarter ? quarter.trim() : accident.quarter,
      title: title.trim(),
      year: year ? parseInt(year) : accident.year,
      description: description || null,
      type: type || 'Incidente',
      status: status || 'Em Investigação',
      isPublished: isPublished === 'on'
    };

    // Processar novos arquivos se enviados
    if (req.files) {
      if (req.files.pdfFile && req.files.pdfFile[0]) {
        updateData.pdfUrl = '/uploads/accidents/pdfs/' + req.files.pdfFile[0].filename;
      }
      if (req.files.imageFile && req.files.imageFile[0]) {
        updateData.imageUrl = '/uploads/accidents/images/' + req.files.imageFile[0].filename;
      }
    }

    await accident.update(updateData);

    req.flash('success', 'Acidente/Incidente atualizado com sucesso!');
    res.redirect('/admin/accidents');
  } catch (error) {
    console.error('Erro ao atualizar acidente:', error);
    req.flash('error', 'Erro ao atualizar acidente/incidente');
    res.redirect(`/admin/accidents/${req.params.id}/edit`);
  }
};

// =============================================
// EXCLUIR
// =============================================
exports.destroy = async (req, res) => {
  try {
    const accident = await Accident.findByPk(req.params.id);

    if (!accident) {
      req.flash('error', 'Acidente/Incidente não encontrado');
      return res.redirect('/admin/accidents');
    }

    await accident.destroy();
    req.flash('success', 'Acidente/Incidente excluído com sucesso!');
    res.redirect('/admin/accidents');
  } catch (error) {
    console.error('Erro ao excluir acidente:', error);
    req.flash('error', 'Erro ao excluir acidente/incidente');
    res.redirect('/admin/accidents');
  }
};