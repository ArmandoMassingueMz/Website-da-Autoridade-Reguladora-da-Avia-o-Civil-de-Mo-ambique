const { Form, User } = require('../models');
const { Op } = require('sequelize');
const path = require('path');
const fs = require('fs');

// =============================================
// LISTAR TODOS OS FORMULÁRIOS (ADMIN)
// =============================================
exports.index = async (req, res) => {
  try {
    const forms = await Form.findAll({
      include: [{ model: User, as: 'author', attributes: ['name', 'email'] }],
      order: [['formNumber', 'ASC']]
    });

    res.render('admin/forms/index', {
      title: 'Gestão de Formulários - IACM',
      currentPage: 'forms',
      forms
    });
  } catch (error) {
    console.error('Erro ao listar formulários:', error);
    req.flash('error', 'Erro ao carregar formulários');
    res.redirect('/admin/dashboard');
  }
};

// =============================================
// FORMULÁRIO DE CRIAÇÃO
// =============================================
exports.create = (req, res) => {
  res.render('admin/forms/create', {
    title: 'Criar Novo Formulário - IACM',
    currentPage: 'forms'
  });
};

// =============================================
// PROCESSAR CRIAÇÃO
// =============================================
exports.store = async (req, res) => {
  try {
    const { 
      formNumber, 
      title, 
      description, 
      category, 
      language, 
      version, 
      isPublished 
    } = req.body;

    // Validações
    if (!formNumber || !title) {
      req.flash('error', 'Número e título são obrigatórios');
      return res.redirect('/admin/forms/create');
    }

    // Verificar se número já existe
    const existingForm = await Form.findOne({ where: { formNumber } });
    if (existingForm) {
      req.flash('error', 'Já existe um formulário com este número');
      return res.redirect('/admin/forms/create');
    }

    // Processar arquivo PDF
    let pdfUrl = null;
    if (req.file) {
      pdfUrl = '/uploads/forms/' + req.file.filename;
    } else if (req.body.fileUrl) {
      pdfUrl = req.body.fileUrl;
    } else {
      req.flash('error', 'É necessário enviar um arquivo PDF');
      return res.redirect('/admin/forms/create');
    }

    // Criar formulário
    const form = await Form.create({
      formNumber: formNumber.trim(),
      title: title.trim(),
      description: description || null,
      category: category || 'Notificação',
      language: language || 'Português',
      version: version || '1.0',
      pdfUrl,
      fileSize: req.file ? (req.file.size / 1024).toFixed(2) + ' KB' : null,
      isPublished: isPublished === 'on',
      authorId: req.session.user.id,
      publicationDate: new Date()
    });

    req.flash('success', 'Formulário criado com sucesso!');
    res.redirect('/admin/forms');
  } catch (error) {
    console.error('Erro ao criar formulário:', error);
    
    if (error.name === 'SequelizeValidationError') {
      const messages = error.errors.map(err => err.message).join(', ');
      req.flash('error', `Erro de validação: ${messages}`);
    } else {
      req.flash('error', 'Erro ao criar formulário');
    }
    
    res.redirect('/admin/forms/create');
  }
};

// =============================================
// FORMULÁRIO DE EDIÇÃO
// =============================================
exports.edit = async (req, res) => {
  try {
    const form = await Form.findByPk(req.params.id);

    if (!form) {
      req.flash('error', 'Formulário não encontrado');
      return res.redirect('/admin/forms');
    }

    res.render('admin/forms/edit', {
      title: 'Editar Formulário - IACM',
      currentPage: 'forms',
      form
    });
  } catch (error) {
    console.error('Erro ao carregar formulário para edição:', error);
    req.flash('error', 'Erro ao carregar formulário');
    res.redirect('/admin/forms');
  }
};

// =============================================
// PROCESSAR EDIÇÃO
// =============================================
exports.update = async (req, res) => {
  try {
    const { 
      formNumber, 
      title, 
      description, 
      category, 
      language, 
      version, 
      isPublished 
    } = req.body;
    
    const form = await Form.findByPk(req.params.id);

    if (!form) {
      req.flash('error', 'Formulário não encontrado');
      return res.redirect('/admin/forms');
    }

    // Verificar se novo número já existe (exceto para este formulário)
    if (formNumber !== form.formNumber) {
      const existingForm = await Form.findOne({ 
        where: { 
          formNumber,
          id: { [Op.ne]: form.id }
        } 
      });
      if (existingForm) {
        req.flash('error', 'Já existe outro formulário com este número');
        return res.redirect(`/admin/forms/${form.id}/edit`);
      }
    }

    let updateData = {
      formNumber: formNumber.trim(),
      title: title.trim(),
      description: description || null,
      category: category || 'Notificação',
      language: language || 'Português',
      version: version || '1.0',
      isPublished: isPublished === 'on'
    };

    // Processar novo arquivo PDF se enviado
    if (req.file) {
      // Remover arquivo antigo se existir
      if (form.pdfUrl && form.pdfUrl.startsWith('/uploads/forms/')) {
        const oldPath = path.join(__dirname, '../public', form.pdfUrl);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }
      
      updateData.pdfUrl = '/uploads/forms/' + req.file.filename;
      updateData.fileSize = (req.file.size / 1024).toFixed(2) + ' KB';
    }

    await form.update(updateData);

    req.flash('success', 'Formulário atualizado com sucesso!');
    res.redirect('/admin/forms');
  } catch (error) {
    console.error('Erro ao atualizar formulário:', error);
    req.flash('error', 'Erro ao atualizar formulário');
    res.redirect(`/admin/forms/${req.params.id}/edit`);
  }
};

// =============================================
// EXCLUIR
// =============================================
exports.destroy = async (req, res) => {
  try {
    const form = await Form.findByPk(req.params.id);

    if (!form) {
      req.flash('error', 'Formulário não encontrado');
      return res.redirect('/admin/forms');
    }

    // Remover arquivo PDF
    if (form.pdfUrl && form.pdfUrl.startsWith('/uploads/forms/')) {
      const filePath = path.join(__dirname, '../public', form.pdfUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await form.destroy();
    req.flash('success', 'Formulário excluído com sucesso!');
    res.redirect('/admin/forms');
  } catch (error) {
    console.error('Erro ao excluir formulário:', error);
    req.flash('error', 'Erro ao excluir formulário');
    res.redirect('/admin/forms');
  }
};

// =============================================
// API: BUSCAR TODOS OS FORMULÁRIOS (PÚBLICO)
// =============================================
exports.getAllForms = async (req, res) => {
  try {
    const forms = await Form.findAll({
      where: { 
        isPublished: true,
        isActive: true 
      },
      order: [['formNumber', 'ASC']]
    });

    res.json({
      success: true,
      count: forms.length,
      data: forms
    });
  } catch (error) {
    console.error('Erro ao buscar formulários:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar formulários'
    });
  }
};

// =============================================
// API: BUSCAR POR CATEGORIA
// =============================================
exports.getFormsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    
    const forms = await Form.findAll({
      where: { 
        category,
        isPublished: true,
        isActive: true 
      },
      order: [['formNumber', 'ASC']]
    });

    res.json({
      success: true,
      count: forms.length,
      data: forms
    });
  } catch (error) {
    console.error('Erro ao buscar formulários por categoria:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar formulários'
    });
  }
};

// =============================================
// API: INCREMENTAR DOWNLOAD
// =============================================
exports.incrementDownload = async (req, res) => {
  try {
    const { id } = req.params;
    
    const form = await Form.findByPk(id);
    
    if (!form) {
      return res.status(404).json({
        success: false,
        message: 'Formulário não encontrado'
      });
    }

    await form.update({
      downloadCount: form.downloadCount + 1
    });

    res.json({
      success: true,
      downloadCount: form.downloadCount
    });
  } catch (error) {
    console.error('Erro ao incrementar download:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao registrar download'
    });
  }
};