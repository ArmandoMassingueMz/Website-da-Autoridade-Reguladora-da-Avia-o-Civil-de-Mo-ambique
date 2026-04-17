const { OtherService, User } = require('../models');
const path = require('path');
const fs = require('fs').promises;

// =============================================
// LISTAR TODOS OS OUTROS SERVIÇOS
// =============================================
exports.list = async (req, res) => {
  try {
    console.log('📍 Controller list - Buscando serviços...');
    
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
        ['order', 'ASC'],
        ['createdAt', 'DESC']
      ]
    });

    console.log(`✅ ${services.length} serviços encontrados`);

    res.render('admin/other-services/index', {
      title: 'Gerenciar Outros Serviços - IACM',
      currentPage: 'other-services',
      services,
      layout: 'layouts/admin'
    });
  } catch (error) {
    console.error('❌ Erro ao listar outros serviços:', error);
    req.flash('error', 'Erro ao carregar outros serviços');
    res.redirect('/admin/dashboard');
  }
};

// =============================================
// EXIBIR FORMULÁRIO DE CRIAÇÃO
// =============================================
exports.create = (req, res) => {
  const serviceTypes = [
    'Passageiros',
    'Direção de Segurança de Voo',
    'Pessoal aeronáutico',
    'Direção de Facilitação',
    'Direção de Infraestruturas Aeronáuticas e Navegação Aérea',
    'Direção de Regulação Econômica'
  ];

  const icons = [
    'fas fa-plane',
    'fas fa-shield-alt',
    'fas fa-users',
    'fas fa-clipboard-check',
    'fas fa-building',
    'fas fa-chart-line',
    'fas fa-cog',
    'fas fa-file-alt',
    'fas fa-briefcase'
  ];

  res.render('admin/other-services/create', {
    title: 'Novo Serviço - IACM',
    currentPage: 'other-services',
    serviceTypes,
    icons,
    layout: 'layouts/admin'
  });
};

// =============================================
// SALVAR NOVO SERVIÇO
// =============================================
exports.store = async (req, res) => {
  try {
    const { 
      serviceName, 
      title, 
      subtitle, 
      description,
      icon,
      order,
      displayOrder,
      isActive 
    } = req.body;

    if (!serviceName || !title) {
      req.flash('error', 'Nome do serviço e título são obrigatórios');
      return res.redirect('/admin/other-services/create');
    }

    let pdfUrl = null;
    if (req.file) {
      pdfUrl = `/uploads/other-services/${req.file.filename}`;
    }

    await OtherService.create({
      serviceName,
      title,
      subtitle: subtitle || null,
      description: description || null,
      pdfUrl,
      icon: icon || 'fas fa-cog',
      order: order || 0,
      displayOrder: displayOrder || 0,
      isActive: isActive === 'on' || isActive === 'true',
      authorId: req.session.user.id
    });

    req.flash('success', 'Serviço criado com sucesso!');
    res.redirect('/admin/other-services');
  } catch (error) {
    console.error('Erro ao criar serviço:', error);
    req.flash('error', 'Erro ao criar serviço: ' + error.message);
    res.redirect('/admin/other-services/create');
  }
};

// =============================================
// EXIBIR FORMULÁRIO DE EDIÇÃO
// =============================================
exports.edit = async (req, res) => {
  try {
    const service = await OtherService.findByPk(req.params.id);

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

    const icons = [
      'fas fa-plane',
      'fas fa-shield-alt',
      'fas fa-users',
      'fas fa-clipboard-check',
      'fas fa-building',
      'fas fa-chart-line',
      'fas fa-cog',
      'fas fa-file-alt',
      'fas fa-briefcase'
    ];

    res.render('admin/other-services/edit', {
      title: 'Editar Serviço - IACM',
      currentPage: 'other-services',
      service,
      serviceTypes,
      icons,
      layout: 'layouts/admin'
    });
  } catch (error) {
    console.error('Erro ao carregar serviço:', error);
    req.flash('error', 'Erro ao carregar serviço');
    res.redirect('/admin/other-services');
  }
};

// =============================================
// ATUALIZAR SERVIÇO
// =============================================
exports.update = async (req, res) => {
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
      icon,
      order,
      displayOrder,
      isActive 
    } = req.body;

    if (!serviceName || !title) {
      req.flash('error', 'Nome do serviço e título são obrigatórios');
      return res.redirect(`/admin/other-services/${req.params.id}/edit`);
    }

    // Processar novo arquivo se foi enviado
    let pdfUrl = service.pdfUrl;
    if (req.file) {
      // ✅ Remover arquivo antigo com verificação segura
      if (service.pdfUrl) {
        const oldFilePath = path.join(process.cwd(), 'public', service.pdfUrl);
        try {
          await fs.access(oldFilePath);
          await fs.unlink(oldFilePath);
          console.log('✅ Arquivo antigo removido:', oldFilePath);
        } catch (err) {
          if (err.code === 'ENOENT') {
            console.log('ℹ️ Arquivo antigo não encontrado, continuando...');
          } else {
            console.error('⚠️ Erro ao remover arquivo antigo:', err.message);
          }
        }
      }
      pdfUrl = `/uploads/other-services/${req.file.filename}`;
    }

    await service.update({
      serviceName,
      title,
      subtitle: subtitle || null,
      description: description || null,
      pdfUrl,
      icon: icon || 'fas fa-cog',
      order: order || 0,
      displayOrder: displayOrder || 0,
      isActive: isActive === 'on' || isActive === 'true'
    });

    req.flash('success', 'Serviço atualizado com sucesso!');
    res.redirect('/admin/other-services');
  } catch (error) {
    console.error('Erro ao atualizar serviço:', error);
    req.flash('error', 'Erro ao atualizar serviço: ' + error.message);
    res.redirect(`/admin/other-services/${req.params.id}/edit`);
  }
};

// =============================================
// EXCLUIR SERVIÇO
// =============================================
exports.delete = async (req, res) => {
  try {
    const service = await OtherService.findByPk(req.params.id);

    if (!service) {
      req.flash('error', 'Serviço não encontrado');
      return res.redirect('/admin/other-services');
    }

    // ✅ Remover arquivo com verificação segura
    if (service.pdfUrl) {
      const filePath = path.join(process.cwd(), 'public', service.pdfUrl);
      try {
        await fs.access(filePath);
        await fs.unlink(filePath);
        console.log('✅ Arquivo removido:', filePath);
      } catch (err) {
        if (err.code === 'ENOENT') {
          console.log('ℹ️ Arquivo não encontrado, continuando...');
        } else {
          console.error('⚠️ Erro ao remover arquivo:', err.message);
        }
      }
    }

    await service.destroy();

    req.flash('success', 'Serviço excluído com sucesso!');
    res.redirect('/admin/other-services');
  } catch (error) {
    console.error('Erro ao excluir serviço:', error);
    req.flash('error', 'Erro ao excluir serviço');
    res.redirect('/admin/other-services');
  }
};

// =============================================
// ALTERNAR STATUS (ATIVO/INATIVO)
// =============================================
exports.toggleStatus = async (req, res) => {
  try {
    const service = await OtherService.findByPk(req.params.id);

    if (!service) {
      return res.status(404).json({ 
        success: false, 
        message: 'Serviço não encontrado' 
      });
    }

    await service.update({
      isActive: !service.isActive
    });

    res.json({ 
      success: true, 
      isActive: service.isActive,
      message: `Serviço ${service.isActive ? 'ativado' : 'desativado'} com sucesso!`
    });
  } catch (error) {
    console.error('Erro ao alternar status:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao alternar status' 
    });
  }
};