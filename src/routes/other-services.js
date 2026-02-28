const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { requireAuth, requireRole } = require('../middleware/auth');
const { OtherService, User } = require('../models');

// =============================================
// CONFIGURAÇÃO DO MULTER PARA UPLOAD DE ARQUIVOS
// =============================================
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/other-services/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'service-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB
  },
  fileFilter: function (req, file, cb) {
    // Aceitar apenas PDFs
    const filetypes = /pdf/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Apenas arquivos PDF são permitidos!'));
    }
  }
});

// =============================================
// MIDDLEWARE DE AUTENTICAÇÃO E AUTORIZAÇÃO
// =============================================
// Todas as rotas requerem autenticação de admin
router.use(requireAuth);
router.use(requireRole(['admin', 'super_admin']));

// =============================================
// ROTAS DE OUTROS SERVIÇOS
// =============================================

// Listar todos os serviços
router.get('/', async (req, res) => {
  try {
    console.log('📍 Rota /admin/other-services acessada');
    
    const services = await OtherService.findAll({
      include: [
        { 
          model: User, 
          as: 'author',  // ✅ CORREÇÃO: Mudado de 'creator' para 'author'
          attributes: ['id', 'name', 'email']
        }
      ],
      order: [
        ['serviceName', 'ASC'],
        ['displayOrder', 'ASC'],
        ['createdAt', 'DESC']
      ]
    });

    console.log(`✅ ${services.length} serviços encontrados`);

    res.render('admin/other-services/index', {
      title: 'Gerenciar Outros Serviços - IACM',
      currentPage: 'other-services',
      services
    });
  } catch (error) {
    console.error('❌ Erro ao carregar serviços:', error);
    req.flash('error', 'Erro ao carregar serviços');
    res.redirect('/admin/dashboard');
  }
});

// Exibir formulário de criação
router.get('/create', async (req, res) => {
  try {
    const serviceTypes = [
      'Passageiros',
      'Direção de Segurança de Voo',
      'Pessoal aeronáutico',
      'Direção de Facilitação',
      'Direção de Infraestruturas Aeronáuticas e Navegação Aérea',
      'Direção de Regulação Econômica'
    ];
    
    res.render('admin/other-services/create', {
      title: 'Adicionar Novo Serviço - IACM',
      currentPage: 'other-services',
      serviceTypes
    });
  } catch (error) {
    console.error('Erro ao carregar formulário de criação:', error);
    req.flash('error', 'Erro ao carregar formulário');
    res.redirect('/admin/other-services');
  }
});

// Salvar novo serviço
router.post('/create', upload.single('pdfFile'), async (req, res) => {
  try {
    console.log('📝 Iniciando criação de serviço...');
    
    const { 
      serviceName, 
      title, 
      subtitle, 
      description,
      displayOrder,
      isActive 
    } = req.body;

    // Verificar dados obrigatórios
    if (!serviceName || !title) {
      req.flash('error', 'Serviço e Título são obrigatórios');
      return res.redirect('/admin/other-services/create');
    }

    // Processar upload de PDF se existir
    let pdfUrl = null;
    if (req.file) {
      pdfUrl = `/uploads/other-services/${req.file.filename}`;
      console.log(`📄 PDF salvo: ${pdfUrl}`);
    }

    // Criar o serviço - ✅ CORREÇÃO: Usar 'authorId' em vez de 'createdBy'
    const service = await OtherService.create({
      serviceName,
      title,
      subtitle: subtitle || null,
      description: description || null,
      pdfUrl,
      displayOrder: displayOrder || 0,
      isActive: isActive === 'on',
      authorId: req.user.id  // ✅ CORREÇÃO AQUI
    });

    console.log(`✅ Serviço criado: ID ${service.id}`);
    req.flash('success', 'Serviço criado com sucesso!');
    res.redirect('/admin/other-services');
  } catch (error) {
    console.error('❌ Erro ao criar serviço:', error);
    req.flash('error', 'Erro ao criar serviço: ' + error.message);
    res.redirect('/admin/other-services/create');
  }
});

// Exibir formulário de edição
router.get('/:id/edit', async (req, res) => {
  try {
    const service = await OtherService.findByPk(req.params.id, {
      include: [
        { 
          model: User, 
          as: 'author',  // ✅ CORREÇÃO: Mudado de 'creator' para 'author'
          attributes: ['id', 'name', 'email']
        }
      ]
    });
    
    if (!service) {
      req.flash('error', 'Serviço não encontrado');
      return res.redirect('/admin/other-services');
    }

    const serviceTypes = [
      'Passageiros',
      'Direção de Segurança de Voo',
      'Pessoal aeronáutico',
      'Direção de Facilitação',
      'Direção de Infraestruturas Aeronáuticas e Navegação Aérea',
      'Direção de Regulação Econômica'
    ];

    res.render('admin/other-services/edit', {
      title: 'Editar Serviço - IACM',
      currentPage: 'other-services',
      service,
      serviceTypes
    });
  } catch (error) {
    console.error('Erro ao carregar serviço para edição:', error);
    req.flash('error', 'Erro ao carregar serviço');
    res.redirect('/admin/other-services');
  }
});

// Atualizar serviço
router.post('/:id/update', upload.single('pdfFile'), async (req, res) => {
  try {
    const service = await OtherService.findByPk(req.params.id);
    
    if (!service) {
      req.flash('error', 'Serviço não encontrado');
      return res.redirect('/admin/other-services');
    }

    const { 
      serviceName, 
      title, 
      subtitle, 
      description,
      displayOrder,
      isActive 
    } = req.body;

    // Processar upload de PDF se existir
    let updateData = {
      serviceName,
      title,
      subtitle: subtitle || null,
      description: description || null,
      displayOrder: displayOrder || 0,
      isActive: isActive === 'on'
    };

    if (req.file) {
      // Remover arquivo antigo se existir
      if (service.pdfUrl) {
        try {
          const oldFilePath = path.join(__dirname, '../public', service.pdfUrl);
          await fs.unlink(oldFilePath);
        } catch (error) {
          console.warn('Não foi possível remover arquivo antigo:', error.message);
        }
      }
      
      updateData.pdfUrl = `/uploads/other-services/${req.file.filename}`;
    }

    await service.update(updateData);

    req.flash('success', 'Serviço atualizado com sucesso!');
    res.redirect('/admin/other-services');
  } catch (error) {
    console.error('Erro ao atualizar serviço:', error);
    req.flash('error', 'Erro ao atualizar serviço');
    res.redirect(`/admin/other-services/${req.params.id}/edit`);
  }
});

// Alternar status (AJAX)
router.post('/:id/toggle-active', async (req, res) => {
  try {
    const service = await OtherService.findByPk(req.params.id);
    
    if (!service) {
      return res.status(404).json({ success: false, message: 'Serviço não encontrado' });
    }

    await service.update({ isActive: !service.isActive });
    
    res.json({ 
      success: true, 
      message: `Serviço ${service.isActive ? 'ativado' : 'desativado'} com sucesso!`
    });
  } catch (error) {
    console.error('Erro ao alterar status:', error);
    res.status(500).json({ success: false, message: 'Erro ao alterar status' });
  }
});

// Excluir serviço
router.post('/:id/delete', async (req, res) => {
  try {
    const service = await OtherService.findByPk(req.params.id);
    
    if (!service) {
      req.flash('error', 'Serviço não encontrado');
      return res.redirect('/admin/other-services');
    }

    // Remover arquivo PDF se existir
    if (service.pdfUrl) {
      try {
        const filePath = path.join(__dirname, '../public', service.pdfUrl);
        await fs.unlink(filePath);
      } catch (fileError) {
        console.warn('Não foi possível remover o arquivo PDF:', fileError.message);
      }
    }

    await service.destroy();
    
    req.flash('success', 'Serviço deletado com sucesso!');
    res.redirect('/admin/other-services');
  } catch (error) {
    console.error('Erro ao deletar serviço:', error);
    req.flash('error', 'Erro ao deletar serviço');
    res.redirect('/admin/other-services');
  }
});

module.exports = router;