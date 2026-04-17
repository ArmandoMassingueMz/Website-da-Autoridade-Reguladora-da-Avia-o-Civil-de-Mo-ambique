const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const fsSync = require('fs');
const { requireAuth, requireRole } = require('../middleware/auth');
const { OtherService, User } = require('../models');

// =============================================
// ✅ CORRECÇÃO: usar __dirname que aponta para src/routes/
// path.join(__dirname, '..', 'public') = src/public/ ← correcto
// =============================================
const uploadDir = path.join(__dirname, '..', 'public', 'uploads', 'other-services');
if (!fsSync.existsSync(uploadDir)) {
  fsSync.mkdirSync(uploadDir, { recursive: true });
  console.log(`📁 Pasta criada: ${uploadDir}`);
}

// =============================================
// CONFIGURAÇÃO DO MULTER
// =============================================
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'service-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: function (req, file, cb) {
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
// FUNÇÃO AUXILIAR PARA REMOVER ARQUIVO COM SEGURANÇA
// =============================================
const removeFileIfExists = async (fileUrl) => {
  if (!fileUrl) return;
  try {
    const filePath = path.join(__dirname, '..', 'public', fileUrl);
    await fs.access(filePath);
    await fs.unlink(filePath);
    console.log(`✅ Arquivo removido: ${filePath}`);
  } catch (err) {
    if (err.code === 'ENOENT') {
      console.log(`ℹ️ Arquivo não encontrado, continuando...`);
    } else {
      console.error(`⚠️ Erro ao remover arquivo: ${err.message}`);
    }
  }
};

// =============================================
// FUNÇÃO AUXILIAR PARA OBTER ID DO UTILIZADOR
// =============================================
const getUserId = (req) => {
  if (req.user && req.user.id) return req.user.id;
  if (req.session && req.session.user && req.session.user.id) return req.session.user.id;
  return null;
};

// =============================================
// MIDDLEWARE DE AUTENTICAÇÃO E AUTORIZAÇÃO
// =============================================
router.use(requireAuth);
router.use(requireRole(['admin', 'super_admin']));

// =============================================
// LISTAR TODOS OS SERVIÇOS
// =============================================
router.get('/', async (req, res) => {
  try {
    console.log('📍 Rota /admin/other-services acessada');
    
    const services = await OtherService.findAll({
      include: [
        { 
          model: User, 
          as: 'author',
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

// =============================================
// EXIBIR FORMULÁRIO DE CRIAÇÃO
// =============================================
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

// =============================================
// SALVAR NOVO SERVIÇO
// =============================================
router.post('/create', upload.single('pdfFile'), async (req, res) => {
  try {
    console.log('📝 Iniciando criação de serviço...');
    console.log('📦 Body recebido:', req.body);

    const { 
      serviceName, 
      title, 
      subtitle, 
      description,
      displayOrder,
      isActive 
    } = req.body;

    if (!serviceName || !title) {
      if (req.file) await removeFileIfExists(`/uploads/other-services/${req.file.filename}`);
      req.flash('error', 'Serviço e Título são obrigatórios');
      return res.redirect('/admin/other-services/create');
    }

    const isActiveValue = isActive === 'on' || isActive === 'true' || isActive === '1' || isActive === true;

    let pdfUrl = null;
    if (req.file) {
      pdfUrl = `/uploads/other-services/${req.file.filename}`;
      console.log(`📄 PDF salvo: ${pdfUrl}`);
    }

    const authorId = getUserId(req);
    if (!authorId) {
      if (req.file) await removeFileIfExists(`/uploads/other-services/${req.file.filename}`);
      req.flash('error', 'Sessão expirada. Faça login novamente.');
      return res.redirect('/auth/login');
    }

    const service = await OtherService.create({
      serviceName,
      title,
      subtitle: subtitle || null,
      description: description || null,
      pdfUrl,
      displayOrder: parseInt(displayOrder) || 0,
      isActive: isActiveValue,
      authorId
    });

    console.log(`✅ Serviço criado: ID ${service.id}, isActive: ${isActiveValue}`);
    req.flash('success', 'Serviço criado com sucesso!');
    res.redirect('/admin/other-services');
  } catch (error) {
    console.error('❌ Erro ao criar serviço:', error);
    if (req.file) await removeFileIfExists(`/uploads/other-services/${req.file.filename}`);
    req.flash('error', 'Erro ao criar serviço: ' + error.message);
    res.redirect('/admin/other-services/create');
  }
});

// =============================================
// EXIBIR FORMULÁRIO DE EDIÇÃO
// =============================================
router.get('/:id/edit', async (req, res) => {
  try {
    const service = await OtherService.findByPk(req.params.id, {
      include: [
        { 
          model: User, 
          as: 'author',
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

// =============================================
// ATUALIZAR SERVIÇO
// =============================================
router.post('/:id/update', upload.single('pdfFile'), async (req, res) => {
  try {
    const service = await OtherService.findByPk(req.params.id);
    
    if (!service) {
      if (req.file) await removeFileIfExists(`/uploads/other-services/${req.file.filename}`);
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

    const isActiveValue = isActive === 'on' || isActive === 'true' || isActive === '1' || isActive === true;

    let updateData = {
      serviceName,
      title,
      subtitle: subtitle || null,
      description: description || null,
      displayOrder: parseInt(displayOrder) || 0,
      isActive: isActiveValue
    };

    if (req.file) {
      await removeFileIfExists(service.pdfUrl);
      updateData.pdfUrl = `/uploads/other-services/${req.file.filename}`;
    }

    await service.update(updateData);

    console.log(`✅ Serviço actualizado: ID ${service.id}, isActive: ${isActiveValue}`);
    req.flash('success', 'Serviço atualizado com sucesso!');
    res.redirect('/admin/other-services');
  } catch (error) {
    console.error('Erro ao atualizar serviço:', error);
    if (req.file) await removeFileIfExists(`/uploads/other-services/${req.file.filename}`);
    req.flash('error', 'Erro ao atualizar serviço');
    res.redirect(`/admin/other-services/${req.params.id}/edit`);
  }
});

// =============================================
// ALTERNAR STATUS (AJAX)
// =============================================
router.post('/:id/toggle-active', async (req, res) => {
  try {
    const service = await OtherService.findByPk(req.params.id);
    
    if (!service) {
      return res.status(404).json({ success: false, message: 'Serviço não encontrado' });
    }

    const newStatus = !service.isActive;
    await service.update({ isActive: newStatus });
    
    console.log(`✅ Toggle: Serviço ${service.id} isActive = ${newStatus}`);

    res.json({ 
      success: true, 
      isActive: newStatus,
      message: `Serviço ${newStatus ? 'ativado' : 'desativado'} com sucesso!`
    });
  } catch (error) {
    console.error('Erro ao alterar status:', error);
    res.status(500).json({ success: false, message: 'Erro ao alterar status' });
  }
});

// =============================================
// EXCLUIR SERVIÇO
// =============================================
router.post('/:id/delete', async (req, res) => {
  try {
    const service = await OtherService.findByPk(req.params.id);
    
    if (!service) {
      req.flash('error', 'Serviço não encontrado');
      return res.redirect('/admin/other-services');
    }

    await removeFileIfExists(service.pdfUrl);
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