const { Op } = require('sequelize');
const express = require('express');
const router = express.Router();
const { Contact } = require('../models');
const { requireAuth, requireRole } = require('../middleware/auth');

// =============================================
// ROTA PÚBLICA - ENVIAR MENSAGEM DE CONTATO
// =============================================

// POST /contact - Enviar mensagem de contato (RETORNA JSON)
router.post('/', async (req, res) => {
  try {
    const { nome, email, telefone, assunto, mensagem, newsletter } = req.body;

    console.log('📩 Dados recebidos do formulário:', { 
      nome, email, telefone, assunto, mensagem, newsletter 
    });

    // Validação básica
    if (!nome || !email || !assunto || !mensagem) {
      return res.status(400).json({
        success: false,
        message: 'Por favor, preencha todos os campos obrigatórios'
      });
    }

    // Validação de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Por favor, insira um email válido'
      });
    }

    // Criar novo contato
    const newContact = await Contact.create({
      nome,
      email,
      telefone: telefone || null,
      assunto,
      mensagem,
      newsletter: newsletter ? true : false,
      status: 'novo',
      isRead: false,
      isReplied: false,
      ipAddress: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress,
      userAgent: req.get('User-Agent') || 'Unknown'
    });

    console.log(`✅ Contacto salvo com ID: ${newContact.id}`);
    
    // Retornar JSON de sucesso
    return res.json({
      success: true,
      message: 'Mensagem enviada com sucesso! Entraremos em contacto em breve.',
      contactId: newContact.id
    });

  } catch (error) {
    console.error('❌ Erro ao enviar mensagem de contato:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao enviar mensagem. Por favor, tente novamente.'
    });
  }
});

// =============================================
// ROTAS ADMINISTRATIVAS - GESTÃO DE CONTACTOS
// =============================================

// GET /admin/contacts - Listar todas as mensagens
router.get('/', requireAuth, requireRole(['admin', 'editor']), async (req, res) => {
  try {
    const { status, search, page = 1 } = req.query;
    const limit = 20;
    const offset = (page - 1) * limit;
    
    // Construir filtros
    const where = {};
    
    if (status && status !== 'all') {
      where.status = status;
    }
    
    if (search) {
      where[Op.or] = [
        { nome: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { assunto: { [Op.like]: `%${search}%` } },
        { mensagem: { [Op.like]: `%${search}%` } }
      ];
    }

    // Buscar contatos com paginação
    const { count, rows: contacts } = await Contact.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    const totalPages = Math.ceil(count / limit);

    // Contar por status
    const statusCounts = {
      all: await Contact.count(),
      novo: await Contact.count({ where: { status: 'novo' } }),
      em_analise: await Contact.count({ where: { status: 'em_analise' } }),
      respondido: await Contact.count({ where: { status: 'respondido' } }),
      arquivado: await Contact.count({ where: { status: 'arquivado' } }),
      unread: await Contact.count({ where: { isRead: false } })
    };

    console.log('📊 Estatísticas de contactos:', statusCounts);

    res.render('admin/contacts/list', {
      title: 'Gestão de Contactos - IACM',
      currentPage: 'contacts',
      contacts,
      statusCounts,
      currentStatus: status || 'all',
      searchQuery: search || '',
      pagination: {
        current: parseInt(page),
        total: totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Erro ao listar contatos:', error);
    req.flash('error', 'Erro ao carregar mensagens de contato');
    res.redirect('/admin');
  }
});

// GET /admin/contacts/:id - Ver detalhes da mensagem
router.get('/:id', requireAuth, requireRole(['admin', 'editor']), async (req, res) => {
  try {
    const contact = await Contact.findByPk(req.params.id);

    if (!contact) {
      req.flash('error', 'Mensagem não encontrada');
      return res.redirect('/admin/contacts');
    }

    // Marcar como lida automaticamente
    if (!contact.isRead) {
      await contact.update({ 
        isRead: true,
        status: contact.status === 'novo' ? 'em_analise' : contact.status
      });
    }

    res.render('admin/contacts/show', {
      title: `Contacto: ${contact.assunto} - IACM`,
      currentPage: 'contacts',
      contact
    });

  } catch (error) {
    console.error('Erro ao carregar contacto:', error);
    req.flash('error', 'Erro ao carregar mensagem');
    res.redirect('/admin/contacts');
  }
});

// POST /admin/contacts/:id/status - Atualizar status (RETORNA JSON)
router.post('/:id/status', requireAuth, requireRole(['admin', 'editor']), async (req, res) => {
  try {
    const { status, adminNotes } = req.body;
    const contact = await Contact.findByPk(req.params.id);

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Mensagem não encontrada'
      });
    }

    const updateData = { status };
    
    if (adminNotes !== undefined) {
      updateData.adminNotes = adminNotes;
    }

    if (status === 'respondido') {
      updateData.isReplied = true;
    }

    await contact.update(updateData);

    res.json({
      success: true,
      message: 'Status atualizado com sucesso'
    });

  } catch (error) {
    console.error('Erro ao atualizar status:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar status'
    });
  }
});

// POST /admin/contacts/:id/toggle-read - Alternar status de leitura
router.post('/:id/toggle-read', requireAuth, requireRole(['admin', 'editor']), async (req, res) => {
  try {
    const contact = await Contact.findByPk(req.params.id);

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contacto não encontrado'
      });
    }

    // Alternar o status de leitura
    await contact.update({
      isRead: !contact.isRead
    });

    res.json({
      success: true,
      isRead: contact.isRead,
      message: `Contacto marcado como ${contact.isRead ? 'lido' : 'não lido'}`
    });

  } catch (error) {
    console.error('Erro ao alternar status de leitura:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar status de leitura'
    });
  }
});

// POST /admin/contacts/:id/reply - Marcar como respondido
router.post('/:id/reply', requireAuth, requireRole(['admin', 'editor']), async (req, res) => {
  try {
    const { replyMessage } = req.body;
    const contact = await Contact.findByPk(req.params.id);

    if (!contact) {
      req.flash('error', 'Mensagem não encontrada');
      return res.redirect('/admin/contacts');
    }

    await contact.update({
      isReplied: true,
      status: 'respondido',
      adminNotes: replyMessage || contact.adminNotes
    });

    req.flash('success', 'Contacto marcado como respondido');
    res.redirect(`/admin/contacts/${contact.id}`);

  } catch (error) {
    console.error('Erro ao marcar como respondido:', error);
    req.flash('error', 'Erro ao atualizar contacto');
    res.redirect('/admin/contacts');
  }
});

// DELETE /admin/contacts/:id - Eliminar contacto
router.delete('/:id', requireAuth, requireRole(['admin']), async (req, res) => {
  try {
    const contact = await Contact.findByPk(req.params.id);

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contacto não encontrado'
      });
    }

    await contact.destroy();

    res.json({
      success: true,
      message: 'Contacto eliminado com sucesso'
    });

  } catch (error) {
    console.error('Erro ao eliminar contacto:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao eliminar contacto'
    });
  }
});

// POST /admin/contacts/bulk-action - Ação em massa
router.post('/bulk-action', requireAuth, requireRole(['admin', 'editor']), async (req, res) => {
  try {
    const { action, contactIds } = req.body;

    if (!contactIds || !Array.isArray(contactIds) || contactIds.length === 0) {
      req.flash('error', 'Nenhum contacto selecionado');
      return res.redirect('/admin/contacts');
    }

    switch (action) {
      case 'mark_read':
        await Contact.update(
          { isRead: true },
          { where: { id: contactIds } }
        );
        req.flash('success', `${contactIds.length} contacto(s) marcado(s) como lido(s)`);
        break;

      case 'mark_unread':
        await Contact.update(
          { isRead: false },
          { where: { id: contactIds } }
        );
        req.flash('success', `${contactIds.length} contacto(s) marcado(s) como não lido(s)`);
        break;

      case 'archive':
        await Contact.update(
          { status: 'arquivado' },
          { where: { id: contactIds } }
        );
        req.flash('success', `${contactIds.length} contacto(s) arquivado(s)`);
        break;

      case 'delete':
        await Contact.destroy({
          where: { id: contactIds }
        });
        req.flash('success', `${contactIds.length} contacto(s) eliminado(s)`);
        break;

      default:
        req.flash('error', 'Ação inválida');
    }

    res.redirect('/admin/contacts');

  } catch (error) {
    console.error('Erro em ação em massa:', error);
    req.flash('error', 'Erro ao executar ação em massa');
    res.redirect('/admin/contacts');
  }
});

// =============================================
// API - OBTER CONTAGEM DE NÃO LIDOS
// =============================================

// GET /admin/contacts/api/unread - Contador de não lidos
router.get('/api/unread', async (req, res) => {
  try {
    const count = await Contact.count({
      where: { isRead: false }
    });

    res.json({
      success: true,
      count
    });

  } catch (error) {
    console.error('Erro ao obter contagem:', error);
    res.json({
      success: false,
      count: 0
    });
  }
});

// GET /admin/contacts/api/stats - Estatísticas gerais
router.get('/api/stats', requireAuth, async (req, res) => {
  try {
    const stats = {
      total: await Contact.count(),
      novo: await Contact.count({ where: { status: 'novo' } }),
      em_analise: await Contact.count({ where: { status: 'em_analise' } }),
      respondido: await Contact.count({ where: { status: 'respondido' } }),
      arquivado: await Contact.count({ where: { status: 'arquivado' } }),
      unread: await Contact.count({ where: { isRead: false } }),
      unreplied: await Contact.count({ where: { isReplied: false } })
    };

    res.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('Erro ao obter estatísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao obter estatísticas'
    });
  }
});

module.exports = router;