const { PassengerRight, FAQ, TravelGuide, Complaint, CompensationRule, PortalNews, User } = require('../../models');
const { Op } = require('sequelize');
const path = require('path');
const fs   = require('fs');

// =============================================
// UTILITÁRIO: GERAR SLUG
// =============================================
function generateSlug(text) {
  return text
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

// =============================================
// DASHBOARD
// =============================================
exports.dashboard = async (req, res) => {
  try {
    const stats = {
      totalRights: await PassengerRight.count(),
      totalFaqs: await FAQ.count(),
      totalGuides: await TravelGuide.count(),
      pendingComplaints: await Complaint.count({ where: { status: 'pendente' } }),
      totalComplaints: await Complaint.count(),
      resolvedComplaints: await Complaint.count({ where: { status: 'resolvida' } })
    };

    const recentComplaints = await Complaint.findAll({
      limit: 5,
      order: [['createdAt', 'DESC']]
    });

    res.render('passenger-portal/admin/dashboard', {
      title: 'Dashboard - Portal do Passageiro',
      currentPage: 'dashboard',
      user: req.session?.user || null,
      stats,
      recentComplaints,
      layout: 'passenger-portal/layouts/portal-admin'
    });
  } catch (error) {
    console.error('Erro no dashboard:', error);
    req.flash('error', 'Erro ao carregar dashboard');
    res.redirect('/');
  }
};

// =============================================
// DIREITOS - LISTAR
// =============================================
exports.listRights = async (req, res) => {
  try {
    const rights = await PassengerRight.findAll({
      include: [{ model: User, as: 'author', attributes: ['name'], required: false }],
      order: [['category', 'ASC'], ['display_order', 'ASC']]
    });

    res.render('passenger-portal/admin/rights/list', {
      title: 'Gerenciar Direitos',
      currentPage: 'rights',
      user: req.session?.user || null,
      rights,
      layout: 'passenger-portal/layouts/portal-admin'
    });
  } catch (error) {
    console.error('Erro:', error);
    req.flash('error', 'Erro ao carregar direitos');
    res.redirect('/portal-passageiro/admin/dashboard');
  }
};

// =============================================
// DIREITOS - FORMULÁRIO CRIAR
// =============================================
exports.createRightForm = (req, res) => {
  res.render('passenger-portal/admin/rights/create', {
    title: 'Criar Direito',
    currentPage: 'rights',
    user: req.session?.user || null,
    layout: 'passenger-portal/layouts/portal-admin'
  });
};

// =============================================
// DIREITOS - CRIAR
// =============================================
exports.createRight = async (req, res) => {
  try {
    const { category, title, description, content, compensation_info, legal_basis, icon, display_order, is_published } = req.body;

    await PassengerRight.create({
      category,
      title,
      description,
      content,
      compensation_info,
      legal_basis,
      icon: icon || 'fa-info-circle',
      display_order: display_order || 0,
      is_published: is_published === 'true',
      authorId: req.session?.user?.id || null
    });

    req.flash('success', 'Direito criado com sucesso!');
    res.redirect('/portal-passageiro/admin/rights');
  } catch (error) {
    console.error('Erro:', error);
    req.flash('error', 'Erro ao criar direito');
    res.redirect('/portal-passageiro/admin/rights/create');
  }
};

// =============================================
// DIREITOS - FORMULÁRIO EDITAR
// =============================================
exports.editRightForm = async (req, res) => {
  try {
    const right = await PassengerRight.findByPk(req.params.id);
    
    if (!right) {
      req.flash('error', 'Direito não encontrado');
      return res.redirect('/portal-passageiro/admin/rights');
    }

    res.render('passenger-portal/admin/rights/edit', {
      title: 'Editar Direito',
      currentPage: 'rights',
      user: req.session?.user || null,
      right,
      layout: 'passenger-portal/layouts/portal-admin'
    });
  } catch (error) {
    console.error('Erro:', error);
    req.flash('error', 'Erro ao carregar direito');
    res.redirect('/portal-passageiro/admin/rights');
  }
};

// =============================================
// DIREITOS - ATUALIZAR
// =============================================
exports.updateRight = async (req, res) => {
  try {
    const right = await PassengerRight.findByPk(req.params.id);
    
    if (!right) {
      req.flash('error', 'Direito não encontrado');
      return res.redirect('/portal-passageiro/admin/rights');
    }

    const { category, title, description, content, compensation_info, legal_basis, icon, display_order, is_published } = req.body;

    await right.update({
      category,
      title,
      description,
      content,
      compensation_info,
      legal_basis,
      icon,
      display_order,
      is_published: is_published === 'true'
    });

    req.flash('success', 'Direito atualizado com sucesso!');
    res.redirect('/portal-passageiro/admin/rights');
  } catch (error) {
    console.error('Erro:', error);
    req.flash('error', 'Erro ao atualizar direito');
    res.redirect(`/portal-passageiro/admin/rights/${req.params.id}/edit`);
  }
};

// =============================================
// DIREITOS - DELETAR
// =============================================
exports.deleteRight = async (req, res) => {
  try {
    const right = await PassengerRight.findByPk(req.params.id);
    
    if (!right) {
      req.flash('error', 'Direito não encontrado');
      return res.redirect('/portal-passageiro/admin/rights');
    }

    await right.destroy();
    req.flash('success', 'Direito deletado com sucesso!');
    res.redirect('/portal-passageiro/admin/rights');
  } catch (error) {
    console.error('Erro:', error);
    req.flash('error', 'Erro ao deletar direito');
    res.redirect('/portal-passageiro/admin/rights');
  }
};

// =============================================
// FAQs - LISTAR
// =============================================
exports.listFaqs = async (req, res) => {
  try {
    const faqs = await FAQ.findAll({
      include: [{ model: User, as: 'author', attributes: ['name'], required: false }],
      order: [['category', 'ASC'], ['display_order', 'ASC']]
    });

    res.render('passenger-portal/admin/faqs/list', {
      title: 'Gerenciar FAQs',
      currentPage: 'faqs',
      user: req.session?.user || null,
      faqs,
      layout: 'passenger-portal/layouts/portal-admin'
    });
  } catch (error) {
    console.error('Erro:', error);
    req.flash('error', 'Erro ao carregar FAQs');
    res.redirect('/portal-passageiro/admin/dashboard');
  }
};

// =============================================
// FAQs - FORMULÁRIO CRIAR
// =============================================
exports.createFaqForm = (req, res) => {
  res.render('passenger-portal/admin/faqs/create', {
    title: 'Criar FAQ',
    currentPage: 'faqs',
    user: req.session?.user || null,
    layout: 'passenger-portal/layouts/portal-admin'
  });
};

// =============================================
// FAQs - CRIAR
// =============================================
exports.createFaq = async (req, res) => {
  try {
    const { category, question, answer, display_order, is_published } = req.body;

    await FAQ.create({
      category,
      question,
      answer,
      display_order: display_order || 0,
      is_published: is_published === 'true',
      authorId: req.session?.user?.id || null
    });

    req.flash('success', 'FAQ criado com sucesso!');
    res.redirect('/portal-passageiro/admin/faqs');
  } catch (error) {
    console.error('Erro:', error);
    req.flash('error', 'Erro ao criar FAQ');
    res.redirect('/portal-passageiro/admin/faqs/create');
  }
};

// =============================================
// FAQs - FORMULÁRIO EDITAR
// =============================================
exports.editFaqForm = async (req, res) => {
  try {
    const faq = await FAQ.findByPk(req.params.id);
    
    if (!faq) {
      req.flash('error', 'FAQ não encontrado');
      return res.redirect('/portal-passageiro/admin/faqs');
    }

    res.render('passenger-portal/admin/faqs/edit', {
      title: 'Editar FAQ',
      currentPage: 'faqs',
      user: req.session?.user || null,
      faq,
      layout: 'passenger-portal/layouts/portal-admin'
    });
  } catch (error) {
    console.error('Erro:', error);
    req.flash('error', 'Erro ao carregar FAQ');
    res.redirect('/portal-passageiro/admin/faqs');
  }
};

// =============================================
// FAQs - ATUALIZAR
// =============================================
exports.updateFaq = async (req, res) => {
  try {
    const faq = await FAQ.findByPk(req.params.id);
    
    if (!faq) {
      req.flash('error', 'FAQ não encontrado');
      return res.redirect('/portal-passageiro/admin/faqs');
    }

    const { category, question, answer, display_order, is_published } = req.body;

    await faq.update({
      category,
      question,
      answer,
      display_order,
      is_published: is_published === 'true'
    });

    req.flash('success', 'FAQ atualizado com sucesso!');
    res.redirect('/portal-passageiro/admin/faqs');
  } catch (error) {
    console.error('Erro:', error);
    req.flash('error', 'Erro ao atualizar FAQ');
    res.redirect(`/portal-passageiro/admin/faqs/${req.params.id}/edit`);
  }
};

// =============================================
// FAQs - DELETAR
// =============================================
exports.deleteFaq = async (req, res) => {
  try {
    const faq = await FAQ.findByPk(req.params.id);
    
    if (!faq) {
      req.flash('error', 'FAQ não encontrado');
      return res.redirect('/portal-passageiro/admin/faqs');
    }

    await faq.destroy();
    req.flash('success', 'FAQ deletado com sucesso!');
    res.redirect('/portal-passageiro/admin/faqs');
  } catch (error) {
    console.error('Erro:', error);
    req.flash('error', 'Erro ao deletar FAQ');
    res.redirect('/portal-passageiro/admin/faqs');
  }
};

// =============================================
// RECLAMAÇÕES - LISTAR
// =============================================
exports.listComplaints = async (req, res) => {
  try {
    const { status, priority } = req.query;
    const whereClause = {};
    
    if (status) whereClause.status = status;
    if (priority) whereClause.priority = priority;

    const complaints = await Complaint.findAll({
      where: whereClause,
      order: [['createdAt', 'DESC']]
    });

    res.render('passenger-portal/admin/complaints/list', {
      title: 'Gerenciar Reclamações',
      currentPage: 'complaints',
      user: req.session?.user || null,
      complaints,
      selectedStatus: status,
      selectedPriority: priority,
      layout: 'passenger-portal/layouts/portal-admin'
    });
  } catch (error) {
    console.error('Erro:', error);
    req.flash('error', 'Erro ao carregar reclamações');
    res.redirect('/portal-passageiro/admin/dashboard');
  }
};

// =============================================
// RECLAMAÇÕES - VER DETALHE
// =============================================
exports.viewComplaint = async (req, res) => {
  try {
    const complaint = await Complaint.findByPk(req.params.id);
    
    if (!complaint) {
      req.flash('error', 'Reclamação não encontrada');
      return res.redirect('/portal-passageiro/admin/complaints');
    }

    res.render('passenger-portal/admin/complaints/view', {
      title: `Reclamação #${complaint.id}`,
      currentPage: 'complaints',
      user: req.session?.user || null,
      complaint,
      layout: 'passenger-portal/layouts/portal-admin'
    });
  } catch (error) {
    console.error('Erro:', error);
    req.flash('error', 'Erro ao carregar reclamação');
    res.redirect('/portal-passageiro/admin/complaints');
  }
};

// =============================================
// RECLAMAÇÕES - ATUALIZAR STATUS
// =============================================
exports.updateComplaintStatus = async (req, res) => {
  try {
    const complaint = await Complaint.findByPk(req.params.id);
    
    if (!complaint) {
      req.flash('error', 'Reclamação não encontrada');
      return res.redirect('/portal-passageiro/admin/complaints');
    }

    const { status, priority } = req.body;
    
    const updateData = { status };
    if (priority) updateData.priority = priority;
    if (status === 'resolvida') updateData.resolved_at = new Date();

    await complaint.update(updateData);

    req.flash('success', 'Status atualizado com sucesso!');
    res.redirect(`/portal-passageiro/admin/complaints/${complaint.id}`);
  } catch (error) {
    console.error('Erro:', error);
    req.flash('error', 'Erro ao atualizar status');
    res.redirect(`/portal-passageiro/admin/complaints/${req.params.id}`);
  }
};

// =============================================
// RECLAMAÇÕES - ADICIONAR NOTA
// =============================================
exports.addComplaintNote = async (req, res) => {
  try {
    const complaint = await Complaint.findByPk(req.params.id);
    
    if (!complaint) {
      req.flash('error', 'Reclamação não encontrada');
      return res.redirect('/portal-passageiro/admin/complaints');
    }

    const { admin_notes } = req.body;
    await complaint.update({ admin_notes });

    req.flash('success', 'Nota adicionada com sucesso!');
    res.redirect(`/portal-passageiro/admin/complaints/${complaint.id}`);
  } catch (error) {
    console.error('Erro:', error);
    req.flash('error', 'Erro ao adicionar nota');
    res.redirect(`/portal-passageiro/admin/complaints/${req.params.id}`);
  }
};

// =============================================
// RECLAMAÇÕES - DELETAR
// =============================================
exports.deleteComplaint = async (req, res) => {
  try {
    const complaint = await Complaint.findByPk(req.params.id);
    
    if (!complaint) {
      req.flash('error', 'Reclamação não encontrada');
      return res.redirect('/portal-passageiro/admin/complaints');
    }

    await complaint.destroy();
    req.flash('success', 'Reclamação deletada com sucesso!');
    res.redirect('/portal-passageiro/admin/complaints');
  } catch (error) {
    console.error('Erro:', error);
    req.flash('error', 'Erro ao deletar reclamação');
    res.redirect('/portal-passageiro/admin/complaints');
  }
};

// =============================================
// GUIAS - LISTAR
// =============================================
exports.listGuides = async (req, res) => {
  try {
    const guides = await TravelGuide.findAll({
      include: [{ model: User, as: 'author', attributes: ['name'], required: false }],
      order: [['phase', 'ASC'], ['display_order', 'ASC']]
    });

    res.render('passenger-portal/admin/guides/list', {
      title: 'Gerenciar Guias',
      currentPage: 'guides',
      user: req.session?.user || null,
      guides,
      layout: 'passenger-portal/layouts/portal-admin'
    });
  } catch (error) {
    console.error('Erro:', error);
    req.flash('error', 'Erro ao carregar guias');
    res.redirect('/portal-passageiro/admin/dashboard');
  }
};

// =============================================
// GUIAS - FORMULÁRIO CRIAR
// =============================================
exports.createGuideForm = (req, res) => {
  res.render('passenger-portal/admin/guides/create', {
    title: 'Criar Guia',
    currentPage: 'guides',
    user: req.session?.user || null,
    layout: 'passenger-portal/layouts/portal-admin'
  });
};

// =============================================
// GUIAS - CRIAR
// =============================================
exports.createGuide = async (req, res) => {
  try {
    const { phase, title, content, icon, display_order, is_published } = req.body;
    
    const slug = title.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');

    await TravelGuide.create({
      phase,
      title,
      slug,
      content,
      icon: icon || 'fa-plane',
      display_order: display_order || 0,
      is_published: is_published === 'true',
      authorId: req.session?.user?.id || null
    });

    req.flash('success', 'Guia criado com sucesso!');
    res.redirect('/portal-passageiro/admin/guides');
  } catch (error) {
    console.error('Erro:', error);
    req.flash('error', 'Erro ao criar guia');
    res.redirect('/portal-passageiro/admin/guides/create');
  }
};

// =============================================
// GUIAS - FORMULÁRIO EDITAR
// =============================================
exports.editGuideForm = async (req, res) => {
  try {
    const guide = await TravelGuide.findByPk(req.params.id);
    
    if (!guide) {
      req.flash('error', 'Guia não encontrado');
      return res.redirect('/portal-passageiro/admin/guides');
    }

    res.render('passenger-portal/admin/guides/edit', {
      title: 'Editar Guia',
      currentPage: 'guides',
      user: req.session?.user || null,
      guide,
      layout: 'passenger-portal/layouts/portal-admin'
    });
  } catch (error) {
    console.error('Erro:', error);
    req.flash('error', 'Erro ao carregar guia');
    res.redirect('/portal-passageiro/admin/guides');
  }
};

// =============================================
// GUIAS - ATUALIZAR
// =============================================
exports.updateGuide = async (req, res) => {
  try {
    const guide = await TravelGuide.findByPk(req.params.id);
    
    if (!guide) {
      req.flash('error', 'Guia não encontrado');
      return res.redirect('/portal-passageiro/admin/guides');
    }

    const { phase, title, content, icon, display_order, is_published } = req.body;
    const slug = title.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');

    await guide.update({
      phase,
      title,
      slug,
      content,
      icon,
      display_order,
      is_published: is_published === 'true'
    });

    req.flash('success', 'Guia atualizado com sucesso!');
    res.redirect('/portal-passageiro/admin/guides');
  } catch (error) {
    console.error('Erro:', error);
    req.flash('error', 'Erro ao atualizar guia');
    res.redirect(`/portal-passageiro/admin/guides/${req.params.id}/edit`);
  }
};

// =============================================
// GUIAS - DELETAR
// =============================================
exports.deleteGuide = async (req, res) => {
  try {
    const guide = await TravelGuide.findByPk(req.params.id);
    
    if (!guide) {
      req.flash('error', 'Guia não encontrado');
      return res.redirect('/portal-passageiro/admin/guides');
    }

    await guide.destroy();
    req.flash('success', 'Guia deletado com sucesso!');
    res.redirect('/portal-passageiro/admin/guides');
  } catch (error) {
    console.error('Erro:', error);
    req.flash('error', 'Erro ao deletar guia');
    res.redirect('/portal-passageiro/admin/guides');
  }
};

// =============================================
// COMPENSAÇÃO - LISTAR
// =============================================
exports.listCompensation = async (req, res) => {
  try {
    const { rule_type, distance_category, is_active } = req.query;

    const where = {};
    if (rule_type)         where.rule_type         = rule_type;
    if (distance_category) where.distance_category = distance_category;
    if (is_active !== undefined && is_active !== '') {
      where.is_active = is_active === '1';
    }

    const rules = await CompensationRule.findAll({
      where,
      order: [['rule_type', 'ASC'], ['distance_category', 'ASC']]
    });

    // Stats sem filtros aplicados
    const allRules = await CompensationRule.findAll();
    const stats = {
      total:    allRules.length,
      active:   allRules.filter(r => r.is_active).length,
      inactive: allRules.filter(r => !r.is_active).length,
      types:    [...new Set(allRules.map(r => r.rule_type))].length
    };

    res.render('passenger-portal/admin/compensation/list', {
      title: 'Regras de Compensação',
      currentPage: 'compensation',
      user: req.session?.user || null,
      rules,
      stats,
      filters: { rule_type, distance_category, is_active },
      layout: 'passenger-portal/layouts/portal-admin'
    });
  } catch (error) {
    console.error('Erro ao listar compensações:', error);
    req.flash('error', 'Erro ao carregar regras de compensação');
    res.redirect('/portal-passageiro/admin/dashboard');
  }
};

// =============================================
// COMPENSAÇÃO - FORMULÁRIO CRIAR
// =============================================
exports.createCompensationForm = (req, res) => {
  res.render('passenger-portal/admin/compensation/create', {
    title: 'Nova Regra de Compensação',
    currentPage: 'compensation',
    user: req.session?.user || null,
    layout: 'passenger-portal/layouts/portal-admin'
  });
};

// =============================================
// COMPENSAÇÃO - CRIAR
// =============================================
exports.createCompensation = async (req, res) => {
  try {
    const {
      rule_type,
      distance_category,
      delay_hours,
      compensation_amount,
      currency,
      description,
      conditions,
      legal_reference,
      is_active
    } = req.body;

    if (!rule_type || !distance_category || !compensation_amount) {
      req.flash('error', 'Preencha os campos obrigatórios: Tipo, Distância e Valor.');
      return res.redirect('/portal-passageiro/admin/compensation/create');
    }

    await CompensationRule.create({
      rule_type,
      distance_category,
      delay_hours:         delay_hours ? parseInt(delay_hours) : null,
      compensation_amount: parseFloat(compensation_amount),
      currency:            currency || 'MZN',
      description:         description || null,
      conditions:          conditions  || null,
      legal_reference:     legal_reference || null,
      is_active:           is_active === '1',
      authorId:            req.session?.user?.id || null
    });

    req.flash('success', 'Regra de compensação criada com sucesso!');
    res.redirect('/portal-passageiro/admin/compensation');
  } catch (error) {
    console.error('Erro ao criar compensação:', error);
    req.flash('error', 'Erro ao criar regra de compensação');
    res.redirect('/portal-passageiro/admin/compensation/create');
  }
};

// =============================================
// COMPENSAÇÃO - FORMULÁRIO EDITAR
// =============================================
exports.editCompensationForm = async (req, res) => {
  try {
    const rule = await CompensationRule.findByPk(req.params.id);

    if (!rule) {
      req.flash('error', 'Regra não encontrada');
      return res.redirect('/portal-passageiro/admin/compensation');
    }

    res.render('passenger-portal/admin/compensation/edit', {
      title: `Editar Regra #${rule.id}`,
      currentPage: 'compensation',
      user: req.session?.user || null,
      rule,
      layout: 'passenger-portal/layouts/portal-admin'
    });
  } catch (error) {
    console.error('Erro ao carregar regra:', error);
    req.flash('error', 'Erro ao carregar regra de compensação');
    res.redirect('/portal-passageiro/admin/compensation');
  }
};

// =============================================
// COMPENSAÇÃO - ATUALIZAR
// =============================================
exports.updateCompensation = async (req, res) => {
  try {
    const rule = await CompensationRule.findByPk(req.params.id);

    if (!rule) {
      req.flash('error', 'Regra não encontrada');
      return res.redirect('/portal-passageiro/admin/compensation');
    }

    const {
      rule_type,
      distance_category,
      delay_hours,
      compensation_amount,
      currency,
      description,
      conditions,
      legal_reference,
      is_active
    } = req.body;

    if (!rule_type || !distance_category || !compensation_amount) {
      req.flash('error', 'Preencha os campos obrigatórios: Tipo, Distância e Valor.');
      return res.redirect(`/portal-passageiro/admin/compensation/${rule.id}/edit`);
    }

    await rule.update({
      rule_type,
      distance_category,
      delay_hours:         delay_hours ? parseInt(delay_hours) : null,
      compensation_amount: parseFloat(compensation_amount),
      currency:            currency || 'MZN',
      description:         description || null,
      conditions:          conditions  || null,
      legal_reference:     legal_reference || null,
      is_active:           is_active === '1'
    });

    req.flash('success', 'Regra de compensação actualizada com sucesso!');
    res.redirect('/portal-passageiro/admin/compensation');
  } catch (error) {
    console.error('Erro ao actualizar compensação:', error);
    req.flash('error', 'Erro ao actualizar regra de compensação');
    res.redirect(`/portal-passageiro/admin/compensation/${req.params.id}/edit`);
  }
};

// =============================================
// COMPENSAÇÃO - DELETAR
// =============================================
exports.deleteCompensation = async (req, res) => {
  try {
    const rule = await CompensationRule.findByPk(req.params.id);

    if (!rule) {
      req.flash('error', 'Regra não encontrada');
      return res.redirect('/portal-passageiro/admin/compensation');
    }

    await rule.destroy();
    req.flash('success', 'Regra de compensação eliminada com sucesso!');
    res.redirect('/portal-passageiro/admin/compensation');
  } catch (error) {
    console.error('Erro ao eliminar compensação:', error);
    req.flash('error', 'Erro ao eliminar regra de compensação');
    res.redirect('/portal-passageiro/admin/compensation');
  }
};

// =============================================
// NOTÍCIAS - LISTAR
// =============================================
exports.listNews = async (req, res) => {
  try {
    const { search, category, is_published } = req.query;
    const page   = parseInt(req.query.page) || 1;
    const limit  = 15;
    const offset = (page - 1) * limit;

    const where = {};
    if (category) where.category = category;
    if (is_published !== undefined && is_published !== '') {
      where.is_published = is_published === '1';
    }
    if (search) {
      where[Op.or] = [
        { title:   { [Op.like]: `%${search}%` } },
        { excerpt: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows: news } = await PortalNews.findAndCountAll({
      where,
      order:  [['createdAt', 'DESC']],
      limit,
      offset
    });

    // Stats gerais (sem filtros)
    const allNews = await PortalNews.findAll({ attributes: ['is_published', 'createdAt'] });
    const now = new Date();
    const stats = {
      total:     allNews.length,
      published: allNews.filter(n => n.is_published).length,
      drafts:    allNews.filter(n => !n.is_published).length,
      thisMonth: allNews.filter(n => {
        const d = new Date(n.createdAt);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      }).length
    };

    res.render('passenger-portal/admin/news/list', {
      title: 'Notícias do Portal',
      currentPage: 'news',
      user: req.session?.user || null,
      news,
      stats,
      filters: { search, category, is_published },
      paginationPage: page,
      totalPages:  Math.ceil(count / limit),
      layout: 'passenger-portal/layouts/portal-admin'
    });
  } catch (error) {
    console.error('Erro ao listar notícias:', error);
    req.flash('error', 'Erro ao carregar notícias');
    res.redirect('/portal-passageiro/admin/dashboard');
  }
};

// =============================================
// NOTÍCIAS - FORMULÁRIO CRIAR
// =============================================
exports.createNewsForm = (req, res) => {
  res.render('passenger-portal/admin/news/create', {
    title: 'Nova Notícia',
    currentPage: 'news',
    user: req.session?.user || null,
    layout: 'passenger-portal/layouts/portal-admin'
  });
};

// =============================================
// NOTÍCIAS - CRIAR
// =============================================
exports.createNews = async (req, res) => {
  try {
    let {
      title,
      slug,
      excerpt,
      content,
      category,
      tags,
      author,
      publishedAt,
      featured_image_url,
      is_published
    } = req.body;

    if (!title || !content) {
      req.flash('error', 'Título e Conteúdo são obrigatórios.');
      return res.redirect('/portal-passageiro/admin/news/create');
    }

    // Gerar slug se não fornecido
    if (!slug) {
      slug = generateSlug(title);
    }

    // Garantir slug único
    const existing = await PortalNews.findOne({ where: { slug } });
    if (existing) slug = `${slug}-${Date.now()}`;

    // Imagem: ficheiro tem prioridade sobre URL
    let featuredImage = featured_image_url || null;
    if (req.file) {
      featuredImage = `/uploads/passenger-portal/news/${req.file.filename}`;
    }

    const publish = is_published === 'true' || is_published === '1';

    await PortalNews.create({
      title,
      slug,
      excerpt:        excerpt        || null,
      content,
      category:       category       || null,
      tags:           tags           || null,
      author:         author         || 'DRETA',
      featured_image: featuredImage,
      publishedAt:    publishedAt    ? new Date(publishedAt) : new Date(),
      is_published:   publish
    });

    req.flash('success', `Notícia "${title}" criada com sucesso!`);
    res.redirect('/portal-passageiro/admin/news');
  } catch (error) {
    console.error('Erro ao criar notícia:', error);
    req.flash('error', 'Erro ao criar notícia');
    res.redirect('/portal-passageiro/admin/news/create');
  }
};

// =============================================
// NOTÍCIAS - FORMULÁRIO EDITAR
// =============================================
exports.editNewsForm = async (req, res) => {
  try {
    const noticia = await PortalNews.findByPk(req.params.id);

    if (!noticia) {
      req.flash('error', 'Notícia não encontrada');
      return res.redirect('/portal-passageiro/admin/news');
    }

    res.render('passenger-portal/admin/news/edit', {
      title: `Editar: ${noticia.title}`,
      currentPage: 'news',
      user: req.session?.user || null,
      noticia,
      layout: 'passenger-portal/layouts/portal-admin'
    });
  } catch (error) {
    console.error('Erro ao carregar notícia:', error);
    req.flash('error', 'Erro ao carregar notícia');
    res.redirect('/portal-passageiro/admin/news');
  }
};

// =============================================
// NOTÍCIAS - ATUALIZAR
// =============================================
exports.updateNews = async (req, res) => {
  try {
    const noticia = await PortalNews.findByPk(req.params.id);

    if (!noticia) {
      req.flash('error', 'Notícia não encontrada');
      return res.redirect('/portal-passageiro/admin/news');
    }

    let {
      title,
      slug,
      excerpt,
      content,
      category,
      tags,
      author,
      publishedAt,
      featured_image_url,
      is_published,
      remove_image
    } = req.body;

    if (!title || !content) {
      req.flash('error', 'Título e Conteúdo são obrigatórios.');
      return res.redirect(`/portal-passageiro/admin/news/${noticia.id}/edit`);
    }

    if (!slug) slug = generateSlug(title);

    // Garantir slug único (excluindo o registo actual)
    const existing = await PortalNews.findOne({
      where: { slug, id: { [Op.ne]: noticia.id } }
    });
    if (existing) slug = `${slug}-${Date.now()}`;

    // Gestão de imagem
    let featuredImage = noticia.featured_image;
    if (remove_image === '1') featuredImage = null;
    if (req.file) {
      featuredImage = `/uploads/passenger-portal/news/${req.file.filename}`;
    } else if (featured_image_url) {
      featuredImage = featured_image_url;
    }

    await noticia.update({
      title,
      slug,
      excerpt:        excerpt   || null,
      content,
      category:       category  || null,
      tags:           tags      || null,
      author:         author    || 'DRETA',
      featured_image: featuredImage,
      publishedAt:    publishedAt ? new Date(publishedAt) : noticia.publishedAt,
      is_published:   is_published === 'true' || is_published === '1'
    });

    req.flash('success', 'Notícia actualizada com sucesso!');
    res.redirect('/portal-passageiro/admin/news');
  } catch (error) {
    console.error('Erro ao actualizar notícia:', error);
    req.flash('error', 'Erro ao actualizar notícia');
    res.redirect(`/portal-passageiro/admin/news/${req.params.id}/edit`);
  }
};

// =============================================
// NOTÍCIAS - DELETAR
// =============================================
exports.deleteNews = async (req, res) => {
  try {
    const noticia = await PortalNews.findByPk(req.params.id);

    if (!noticia) {
      req.flash('error', 'Notícia não encontrada');
      return res.redirect('/portal-passageiro/admin/news');
    }

    // Remover ficheiro de imagem local se existir
    if (noticia.featured_image && noticia.featured_image.startsWith('/uploads/')) {
      const filePath = path.join(__dirname, '../../public', noticia.featured_image);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    await noticia.destroy();
    req.flash('success', 'Notícia eliminada com sucesso!');
    res.redirect('/portal-passageiro/admin/news');
  } catch (error) {
    console.error('Erro ao eliminar notícia:', error);
    req.flash('error', 'Erro ao eliminar notícia');
    res.redirect('/portal-passageiro/admin/news');
  }
};