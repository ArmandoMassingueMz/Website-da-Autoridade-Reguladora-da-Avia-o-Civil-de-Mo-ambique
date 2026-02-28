const express = require('express');
const router = express.Router();
const { requireAuth, requireRole } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(__dirname, '../public/uploads/team');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'team-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    file.mimetype.startsWith('image/') ? cb(null, true) : cb(new Error('Apenas imagens permitidas!'), false);
  },
  limits: { fileSize: 10 * 1024 * 1024 } // ✅ CORRIGIDO: aumentado de 5MB para 10MB
});

// Middleware para tratar erros do Multer
const uploadWithErrorHandling = (req, res, next) => {
  upload.single('photo')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        req.flash('error', 'A imagem é demasiado grande. Tamanho máximo permitido: 10MB.');
        const redirectUrl = req.params.id
          ? `/admin/team-members/${req.params.id}/edit`
          : '/admin/team-members/create';
        return res.redirect(redirectUrl);
      }
      req.flash('error', `Erro no upload: ${err.message}`);
      return res.redirect('/admin/team-members');
    }
    if (err) {
      req.flash('error', err.message);
      const redirectUrl = req.params.id
        ? `/admin/team-members/${req.params.id}/edit`
        : '/admin/team-members/create';
      return res.redirect(redirectUrl);
    }
    next();
  });
};

const { TeamMember, User } = require('../models');

router.get('/', requireAuth, async (req, res) => {
  try {
    const teamMembers = await TeamMember.findAll({
      include: [{ model: User, as: 'author', attributes: ['name', 'email'] }],
      order: [['displayOrder', 'ASC'], ['name', 'ASC']]
    });

    res.render('admin/team-members/index', {
      title: 'Gestão de Equipe de Liderança - IACM',
      currentPage: 'team-members',
      teamMembers,
      user: req.session.user,
      messages: req.flash(),
      layout: 'layouts/admin'
    });
  } catch (error) {
    console.error('❌ Erro ao listar equipe:', error);
    req.flash('error', 'Erro ao carregar membros da equipe');
    res.redirect('/admin/dashboard');
  }
});

router.get('/create', requireAuth, requireRole(['admin', 'super_admin', 'editor']), (req, res) => {
  res.render('admin/team-members/create', {
    title: 'Adicionar Membro da Equipe - IACM',
    currentPage: 'team-members',
    user: req.session.user,
    messages: req.flash(),
    layout: 'layouts/admin'
  });
});

router.post('/', requireAuth, requireRole(['admin', 'super_admin', 'editor']), uploadWithErrorHandling, async (req, res) => {
  try {
    const { name, position, bio, email, phone, displayOrder, isActive } = req.body;

    if (!name || !position) {
      req.flash('error', 'Nome e cargo são obrigatórios');
      return res.redirect('/admin/team-members/create');
    }

    let photo = '/images/team-default.jpg';
    if (req.file) photo = '/uploads/team/' + req.file.filename;

    await TeamMember.create({
      name: name.trim(), position: position.trim(),
      bio: bio || null, photo,
      email: email || null, phone: phone || null,
      displayOrder: parseInt(displayOrder) || 0,
      isActive: isActive === 'on',
      authorId: req.session.user.id
    });

    req.flash('success', 'Membro adicionado com sucesso!');
    res.redirect('/admin/team-members');
  } catch (error) {
    console.error('❌ Erro ao criar membro:', error);
    req.flash('error', 'Erro ao adicionar membro');
    res.redirect('/admin/team-members/create');
  }
});

router.get('/:id/edit', requireAuth, requireRole(['admin', 'super_admin', 'editor']), async (req, res) => {
  try {
    const teamMember = await TeamMember.findByPk(req.params.id);
    if (!teamMember) {
      req.flash('error', 'Membro não encontrado');
      return res.redirect('/admin/team-members');
    }

    res.render('admin/team-members/edit', {
      title: 'Editar Membro da Equipe - IACM',
      currentPage: 'team-members',
      teamMember,
      user: req.session.user,
      messages: req.flash(),
      layout: 'layouts/admin'
    });
  } catch (error) {
    req.flash('error', 'Erro ao carregar membro');
    res.redirect('/admin/team-members');
  }
});

router.post('/:id', requireAuth, requireRole(['admin', 'super_admin', 'editor']), uploadWithErrorHandling, async (req, res) => {
  try {
    const { name, position, bio, email, phone, displayOrder, isActive, currentPhoto } = req.body;
    const teamMember = await TeamMember.findByPk(req.params.id);

    if (!teamMember) {
      req.flash('error', 'Membro não encontrado');
      return res.redirect('/admin/team-members');
    }

    let photo = currentPhoto || teamMember.photo;
    if (req.file) {
      photo = '/uploads/team/' + req.file.filename;
      if (teamMember.photo && teamMember.photo !== '/images/team-default.jpg') {
        const old = path.join(__dirname, '../public', teamMember.photo);
        if (fs.existsSync(old)) fs.unlinkSync(old);
      }
    }

    await teamMember.update({
      name: name.trim(), position: position.trim(),
      bio: bio || null, photo,
      email: email || null, phone: phone || null,
      displayOrder: parseInt(displayOrder) || 0,
      isActive: isActive === 'on'
    });

    req.flash('success', 'Membro atualizado com sucesso!');
    res.redirect('/admin/team-members');
  } catch (error) {
    console.error('❌ Erro ao atualizar membro:', error);
    req.flash('error', 'Erro ao atualizar membro');
    res.redirect(`/admin/team-members/${req.params.id}/edit`);
  }
});

router.post('/:id/delete', requireAuth, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const teamMember = await TeamMember.findByPk(req.params.id);
    if (!teamMember) {
      req.flash('error', 'Membro não encontrado');
      return res.redirect('/admin/team-members');
    }

    if (teamMember.photo && teamMember.photo !== '/images/team-default.jpg') {
      const p = path.join(__dirname, '../public', teamMember.photo);
      if (fs.existsSync(p)) fs.unlinkSync(p);
    }

    await teamMember.destroy();
    req.flash('success', 'Membro excluído com sucesso!');
    res.redirect('/admin/team-members');
  } catch (error) {
    req.flash('error', 'Erro ao excluir membro');
    res.redirect('/admin/team-members');
  }
});

router.post('/:id/toggle', requireAuth, requireRole(['admin', 'super_admin', 'editor']), async (req, res) => {
  try {
    const teamMember = await TeamMember.findByPk(req.params.id);
    if (!teamMember) return res.status(404).json({ success: false, message: 'Membro não encontrado' });

    await teamMember.update({ isActive: !teamMember.isActive });
    res.json({ success: true, isActive: teamMember.isActive, message: `Membro ${teamMember.isActive ? 'ativado' : 'desativado'}!` });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao atualizar status' });
  }
});

module.exports = router;