const { PassengerRight, FAQ, TravelGuide, Complaint, CompensationRule, PortalNews, User } = require('../../models');
const { Op } = require('sequelize');

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
    
    // Gerar slug
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
  res.render('passenger-portal/admin/compensation/list', {
    title: 'Regras de Compensação',
    currentPage: 'compensation',
    user: req.session?.user || null,
    layout: 'passenger-portal/layouts/portal-admin'
  });
};

// =============================================
// NOTÍCIAS - LISTAR
// =============================================
exports.listNews = async (req, res) => {
  res.render('passenger-portal/admin/news/list', {
    title: 'Notícias do Portal',
    currentPage: 'news',
    user: req.session?.user || null,
    layout: 'passenger-portal/layouts/portal-admin'
  });
};

// Stubs para outros métodos (implementar depois)
exports.createCompensationForm = (req, res) => res.send('TODO');
exports.createCompensation = (req, res) => res.send('TODO');
exports.editCompensationForm = (req, res) => res.send('TODO');
exports.updateCompensation = (req, res) => res.send('TODO');
exports.deleteCompensation = (req, res) => res.send('TODO');

exports.createNewsForm = (req, res) => res.send('TODO');
exports.createNews = (req, res) => res.send('TODO');
exports.editNewsForm = (req, res) => res.send('TODO');
exports.updateNews = (req, res) => res.send('TODO');
exports.deleteNews = (req, res) => res.send('TODO');