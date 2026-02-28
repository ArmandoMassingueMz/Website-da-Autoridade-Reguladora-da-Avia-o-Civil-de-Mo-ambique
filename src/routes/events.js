// routes/events.js
const express = require('express');
const router = express.Router();
const { Event, User } = require('../models');
const { requireAuth, requireRole } = require('../middleware/auth');
const upload = require('../config/upload');
const { Op } = require('sequelize');

// Todas as rotas requerem autenticação
router.use(requireAuth);

// ===============================
// ROTAS DE EVENTOS - ADMIN
// ===============================

// ✅ 1. LISTAR EVENTOS
router.get('/', async (req, res) => {
  try {
    const events = await Event.findAll({
      include: [{
        model: User,
        as: 'author',
        attributes: ['id', 'name', 'email']
      }],
      order: [['startDate', 'DESC']]
    });

    res.render('admin/events/index', {
      title: 'Gestão de Eventos - IACM',
      currentPage: 'events',
      events
    });
  } catch (error) {
    console.error('Erro ao listar eventos:', error);
    req.flash('error', 'Erro ao carregar eventos');
    res.redirect('/admin/dashboard');
  }
});

// ✅ 2. FORMULÁRIO CRIAR
router.get('/create', (req, res) => {
  res.render('admin/events/create', {
    title: 'Criar Evento - IACM',
    currentPage: 'events'
  });
});

// ✅ 3. CRIAR EVENTO (CORRIGIDO - CAMINHO DA IMAGEM!)
router.post('/create', upload.single('featuredImage'), async (req, res) => {
  try {
    const { title, description, startDate, endDate, isPublished } = req.body;

    console.log('📝 Dados recebidos:', { title, description, startDate, endDate, isPublished });

    // Validações
    if (!title || !description || !startDate || !endDate) {
      req.flash('error', 'Título, descrição e datas são obrigatórios');
      return res.redirect('/admin/events/create');
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end <= start) {
      req.flash('error', 'A data de término deve ser posterior à data de início');
      return res.redirect('/admin/events/create');
    }

    // ✅ CORREÇÃO CRÍTICA: Caminho correto da imagem
    let featuredImage = null;
    if (req.file) {
      featuredImage = '/uploads/news/' + req.file.filename;  // ✅ CORRETO: /uploads/news/
      console.log('✅ Imagem do evento salva:', featuredImage);
      console.log('📁 Caminho físico:', req.file.path);
    } else {
      console.log('⚠️  Nenhuma imagem enviada');
    }

    // ✅ CORREÇÃO: Verificar corretamente isPublished
    const isEventPublished = isPublished === 'true' || isPublished === true;
    
    console.log('✅ isPublished calculado:', isEventPublished);

    const event = await Event.create({
      title: title.trim(),
      description: description.trim(),
      featuredImage,
      startDate: start,
      endDate: end,
      isPublished: isEventPublished,
      isActive: true,  // ✅ Sempre ativo quando criado
      authorId: req.session.user.id
    });

    console.log('🎉 Evento criado com sucesso:', {
      id: event.id,
      title: event.title,
      featuredImage: event.featuredImage,
      isPublished: event.isPublished,
      isActive: event.isActive,
      startDate: event.startDate,
      endDate: event.endDate
    });

    req.flash('success', 'Evento criado com sucesso!');
    res.redirect('/admin/events');
  } catch (error) {
    console.error('❌ Erro ao criar evento:', error);
    if (error.name === 'SequelizeValidationError') {
      const messages = error.errors.map(e => e.message).join(', ');
      req.flash('error', `Erro de validação: ${messages}`);
    } else {
      req.flash('error', 'Erro ao criar evento: ' + error.message);
    }
    res.redirect('/admin/events/create');
  }
});

// ✅ 4. DESATIVAR EXPIRADOS
router.post('/deactivate-expired', requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    await Event.deactivateExpiredEvents();
    req.flash('success', 'Eventos expirados desativados com sucesso');
    res.redirect('/admin/events');
  } catch (error) {
    console.error('Erro ao desativar eventos:', error);
    req.flash('error', 'Erro ao desativar eventos');
    res.redirect('/admin/events');
  }
});

// ✅ 5. FORMULÁRIO EDITAR
router.get('/:id/edit', async (req, res) => {
  try {
    const event = await Event.findByPk(req.params.id);

    if (!event) {
      req.flash('error', 'Evento não encontrado');
      return res.redirect('/admin/events');
    }

    res.render('admin/events/edit', {
      title: 'Editar Evento - IACM',
      currentPage: 'events',
      event
    });
  } catch (error) {
    console.error('Erro ao carregar evento para edição:', error);
    req.flash('error', 'Erro ao carregar evento');
    res.redirect('/admin/events');
  }
});

// ✅ 6. ATUALIZAR EVENTO (CORRIGIDO - CAMINHO DA IMAGEM!)
router.post('/:id/edit', upload.single('featuredImage'), async (req, res) => {
  try {
    const event = await Event.findByPk(req.params.id);

    if (!event) {
      req.flash('error', 'Evento não encontrado');
      return res.redirect('/admin/events');
    }

    const { title, description, startDate, endDate, isPublished, isActive, currentImage } = req.body;

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end <= start) {
      req.flash('error', 'A data de término deve ser posterior à data de início');
      return res.redirect(`/admin/events/${event.id}/edit`);
    }

    // ✅ CORREÇÃO: Verificar corretamente isPublished e isActive
    const updateData = {
      title: title.trim(),
      description: description.trim(),
      startDate: start,
      endDate: end,
      isPublished: isPublished === 'true' || isPublished === true,
      isActive: isActive === 'true' || isActive === true || isActive === 'on'
    };

    // ✅ CORREÇÃO CRÍTICA: Caminho correto da imagem
    if (req.file) {
      updateData.featuredImage = '/uploads/news/' + req.file.filename;  // ✅ CORRETO: /uploads/news/
      console.log('✅ Nova imagem do evento:', updateData.featuredImage);
    } else if (currentImage) {
      updateData.featuredImage = currentImage;
    }

    await event.update(updateData);

    console.log('✅ Evento atualizado:', {
      id: event.id,
      featuredImage: event.featuredImage,
      isPublished: updateData.isPublished,
      isActive: updateData.isActive
    });

    req.flash('success', 'Evento atualizado com sucesso!');
    res.redirect('/admin/events');
  } catch (error) {
    console.error('Erro ao atualizar evento:', error);
    if (error.name === 'SequelizeValidationError') {
      const messages = error.errors.map(e => e.message).join(', ');
      req.flash('error', `Erro de validação: ${messages}`);
    } else {
      req.flash('error', 'Erro ao atualizar evento: ' + error.message);
    }
    res.redirect(`/admin/events/${req.params.id}/edit`);
  }
});

// ✅ 7. DELETAR EVENTO
router.post('/:id/delete', async (req, res) => {
  try {
    const event = await Event.findByPk(req.params.id);

    if (!event) {
      req.flash('error', 'Evento não encontrado');
      return res.redirect('/admin/events');
    }

    await event.destroy();
    req.flash('success', 'Evento excluído com sucesso!');
    res.redirect('/admin/events');
  } catch (error) {
    console.error('Erro ao excluir evento:', error);
    req.flash('error', 'Erro ao excluir evento');
    res.redirect('/admin/events');
  }
});

// ✅ 8. VER DETALHES
router.get('/:id', async (req, res) => {
  try {
    const event = await Event.findByPk(req.params.id, {
      include: [{
        model: User,
        as: 'author',
        attributes: ['id', 'name', 'email']
      }]
    });

    if (!event) {
      req.flash('error', 'Evento não encontrado');
      return res.redirect('/admin/events');
    }

    res.render('admin/events/show', {
      title: `${event.title} - IACM`,
      currentPage: 'events',
      event
    });
  } catch (error) {
    console.error('Erro ao buscar evento:', error);
    req.flash('error', 'Erro ao buscar evento');
    res.redirect('/admin/events');
  }
});

module.exports = router;