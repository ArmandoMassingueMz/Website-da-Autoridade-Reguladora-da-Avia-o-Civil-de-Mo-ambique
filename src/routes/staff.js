const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { Staff } = require('../models');
const { requireAuth, requireRole } = require('../middleware/auth');

// Configuração do Multer para upload de fotos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../public/uploads/staff'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'staff-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { 
    fileSize: 10 * 1024 * 1024 // Aumentado para 10MB
  },
  fileFilter: function (req, file, cb) {
    const filetypes = /jpeg|jpg|png|gif|webp/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Apenas imagens são permitidas (jpeg, jpg, png, gif, webp)'));
  }
});

// Middleware para tratamento de erros do Multer
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      req.flash('error', 'O arquivo é muito grande. O tamanho máximo permitido é 10MB.');
      return res.redirect('back');
    }
    req.flash('error', 'Erro no upload: ' + err.message);
    return res.redirect('back');
  } else if (err) {
    req.flash('error', err.message || 'Erro ao fazer upload do arquivo');
    return res.redirect('back');
  }
  next();
};

// ===================================
// ROTAS PÚBLICAS (API para frontend)
// ===================================

// Listar todos os colaboradores ativos (público)
router.get('/api/all', async (req, res) => {
  try {
    const staff = await Staff.findAll({
      where: { isActive: true },
      order: [['department', 'ASC'], ['order', 'ASC'], ['name', 'ASC']]
    });

    // Agrupar por departamento
    const staffByDepartment = {};
    staff.forEach(member => {
      const dept = member.department;
      if (!staffByDepartment[dept]) {
        staffByDepartment[dept] = [];
      }
      staffByDepartment[dept].push(member);
    });

    res.json({
      success: true,
      data: staffByDepartment
    });
  } catch (error) {
    console.error('Erro ao buscar colaboradores:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar colaboradores'
    });
  }
});

// ===================================
// ROTAS ADMINISTRATIVAS
// ===================================

// Listar todos os colaboradores (admin)
router.get('/', requireAuth, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const staff = await Staff.findAll({
      order: [['department', 'ASC'], ['order', 'ASC'], ['name', 'ASC']]
    });

    // Agrupar por departamento
    const staffByDepartment = {};
    staff.forEach(member => {
      const dept = member.department;
      if (!staffByDepartment[dept]) {
        staffByDepartment[dept] = [];
      }
      staffByDepartment[dept].push(member);
    });

    res.render('admin/staff/index', {
      title: 'Gestão de Colaboradores',
      currentPage: 'staff',
      staffByDepartment,
      totalStaff: staff.length
    });
  } catch (error) {
    console.error('Erro ao listar colaboradores:', error);
    req.flash('error', 'Erro ao carregar colaboradores');
    res.redirect('/admin');
  }
});

// Formulário de criação
router.get('/create', requireAuth, requireRole(['admin', 'super_admin']), (req, res) => {
  res.render('admin/staff/create', {
    title: 'Adicionar Colaborador',
    currentPage: 'staff'
  });
});

// Criar colaborador
router.post('/create', requireAuth, requireRole(['admin', 'super_admin']), (req, res, next) => {
  upload.single('photo')(req, res, async (err) => {
    if (err) {
      return handleMulterError(err, req, res, next);
    }

    try {
      const { department, name, position, phone, email, order, isActive } = req.body;
      
      const staffData = {
        department,
        name,
        position,
        phone,
        email: email || null,
        order: order || 0,
        isActive: isActive === 'on' || isActive === true || isActive === '1',
        photo: req.file ? `/uploads/staff/${req.file.filename}` : null
      };

      await Staff.create(staffData);

      req.flash('success', 'Colaborador adicionado com sucesso!');
      res.redirect('/admin/staff');
    } catch (error) {
      console.error('Erro ao criar colaborador:', error);
      req.flash('error', 'Erro ao adicionar colaborador: ' + error.message);
      res.redirect('/admin/staff/create');
    }
  });
});

// Formulário de edição
router.get('/:id/edit', requireAuth, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const staff = await Staff.findByPk(req.params.id);
    
    if (!staff) {
      req.flash('error', 'Colaborador não encontrado');
      return res.redirect('/admin/staff');
    }

    res.render('admin/staff/edit', {
      title: 'Editar Colaborador',
      currentPage: 'staff',
      staff
    });
  } catch (error) {
    console.error('Erro ao carregar colaborador:', error);
    req.flash('error', 'Erro ao carregar colaborador');
    res.redirect('/admin/staff');
  }
});

// Atualizar colaborador
router.post('/:id/edit', requireAuth, requireRole(['admin', 'super_admin']), (req, res, next) => {
  upload.single('photo')(req, res, async (err) => {
    if (err) {
      return handleMulterError(err, req, res, next);
    }

    try {
      const staff = await Staff.findByPk(req.params.id);
      
      if (!staff) {
        req.flash('error', 'Colaborador não encontrado');
        return res.redirect('/admin/staff');
      }

      const { department, name, position, phone, email, order, isActive } = req.body;
      
      staff.department = department;
      staff.name = name;
      staff.position = position;
      staff.phone = phone;
      staff.email = email || null;
      staff.order = order || 0;
      staff.isActive = isActive === 'on' || isActive === true || isActive === '1';
      
      if (req.file) {
        staff.photo = `/uploads/staff/${req.file.filename}`;
      }

      await staff.save();

      req.flash('success', 'Colaborador atualizado com sucesso!');
      res.redirect('/admin/staff');
    } catch (error) {
      console.error('Erro ao atualizar colaborador:', error);
      req.flash('error', 'Erro ao atualizar colaborador: ' + error.message);
      res.redirect(`/admin/staff/${req.params.id}/edit`);
    }
  });
});

// Deletar colaborador
router.post('/:id/delete', requireAuth, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const staff = await Staff.findByPk(req.params.id);
    
    if (!staff) {
      req.flash('error', 'Colaborador não encontrado');
      return res.redirect('/admin/staff');
    }

    await staff.destroy();

    req.flash('success', 'Colaborador removido com sucesso!');
    res.redirect('/admin/staff');
  } catch (error) {
    console.error('Erro ao deletar colaborador:', error);
    req.flash('error', 'Erro ao remover colaborador');
    res.redirect('/admin/staff');
  }
});

// Toggle ativo/inativo
router.post('/:id/toggle', requireAuth, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const staff = await Staff.findByPk(req.params.id);
    
    if (!staff) {
      return res.json({ success: false, message: 'Colaborador não encontrado' });
    }

    staff.isActive = !staff.isActive;
    await staff.save();

    res.json({
      success: true,
      message: `Colaborador ${staff.isActive ? 'ativado' : 'desativado'} com sucesso`,
      isActive: staff.isActive
    });
  } catch (error) {
    console.error('Erro ao alternar status:', error);
    res.json({ success: false, message: 'Erro ao alterar status' });
  }
});

module.exports = router;