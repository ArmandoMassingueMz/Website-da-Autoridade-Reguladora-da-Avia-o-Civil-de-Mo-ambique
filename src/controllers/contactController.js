const { Op } = require('sequelize');
const express = require('express');
const router = express.Router();
const { Contact } = require('../models');
const { requireAuth, requireRole } = require('../middleware/auth');

// =============================================
// ROTA PÚBLICA - ENVIAR MENSAGEM DE CONTATO
// =============================================

// POST /contact - Enviar mensagem de contato (CORRIGIDO)
router.post('/', async (req, res) => {
  try {
    // ✅ CORRIGIDO: Usar nomes corretos do formulário
    const { nome, email, telefone, assunto, mensagem, newsletter } = req.body;

    console.log('📩 Dados recebidos do formulário:', { 
      nome, email, telefone, assunto, mensagem, newsletter 
    });

    // Validação básica
    if (!nome || !email || !assunto || !mensagem) {
      req.flash('error', 'Por favor, preencha todos os campos obrigatórios');
      return res.redirect('/contactos');
    }

    // Criar novo contato
    await Contact.create({
      nome,
      email,
      telefone: telefone || null,
      assunto,
      mensagem,
      newsletter: newsletter ? true : false,
      status: 'novo',
      isRead: false,
      isReplied: false,
      // Adicionar informações adicionais
      ipAddress: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress,
      userAgent: req.get('User-Agent') || 'Unknown'
    });

    console.log('✅ Contacto salvo no banco de dados');
    
    req.flash('success', 'Mensagem enviada com sucesso! Entraremos em contacto em breve.');
    res.redirect('/contactos');

  } catch (error) {
    console.error('❌ Erro ao enviar mensagem de contato:', error);
    req.flash('error', 'Erro ao enviar mensagem. Por favor, tente novamente.');
    res.redirect('/contactos');
  }
});

// ... resto do código mantido igual ...