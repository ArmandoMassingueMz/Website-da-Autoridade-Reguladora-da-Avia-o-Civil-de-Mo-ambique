// controllers/passenger-portal/publicController.js
const { PassengerRight, FAQ, TravelGuide, Complaint, PortalNews } = require('../../models');
const { Op } = require('sequelize');

// =============================================
// CONFIGURAÇÃO DE CATEGORIAS
// =============================================
const categoryConfig = {
  atraso: {
    title: 'Atraso de Voo',
    slug: 'atraso',
    icon: 'fas fa-clock',
    color: 'warning',
    description: 'Conheça seus direitos quando o voo está atrasado.'
  },
  cancelamento: {
    title: 'Cancelamento de Voo',
    slug: 'cancelamento',
    icon: 'fas fa-times-circle',
    color: 'danger',
    description: 'Saiba o que fazer quando seu voo é cancelado.'
  },
  recusa_embarque: {
    title: 'Recusa de Embarque',
    slug: 'recusa_embarque',
    icon: 'fas fa-ban',
    color: 'info',
    description: 'Seus direitos ao ser impedido de embarcar.'
  },
  bagagem: {
    title: 'Direitos sobre Bagagem',
    slug: 'bagagem',
    icon: 'fas fa-suitcase',
    color: 'success',
    description: 'Conheça seus direitos em casos de extravio ou dano à bagagem.'
  },
  deficiencia: {
    title: 'Passageiros com Deficiência',
    slug: 'deficiencia',
    icon: 'fas fa-wheelchair',
    color: 'secondary',
    description: 'Direitos e facilidades para passageiros com deficiência.'
  },
  reembolso: {
    title: 'Reembolso e Devolução',
    slug: 'reembolso',
    icon: 'fas fa-money-bill-wave',
    color: 'primary',
    description: 'Como obter reembolso de passagens e taxas.'
  }
};

// =============================================
// PÁGINA INICIAL DO PORTAL
// =============================================
exports.home = async (req, res) => {
  try {
    const featuredRights = await PassengerRight.findAll({
      where: { is_published: true },
      limit: 6,
      order: [['display_order', 'ASC'], ['createdAt', 'DESC']]
    });

    const recentNews = await PortalNews.findAll({
      where: { is_published: true },
      limit: 3,
      order: [['publishedAt', 'DESC']]
    });

    const topFaqs = await FAQ.findAll({
      where: { is_published: true },
      limit: 5,
      order: [['views', 'DESC']]
    });

    res.render('passenger-portal/public/home', {
      title: 'Portal do Passageiro',
      currentPage: 'home',
      user: req.session?.user || null,
      featuredRights,
      recentNews,
      topFaqs,
      layout: 'passenger-portal/layouts/portal-main'
    });
  } catch (error) {
    console.error('Erro ao carregar home do portal:', error);
    req.flash('error', 'Erro ao carregar a página');
    res.redirect('/');
  }
};

// =============================================
// DIREITOS DOS PASSAGEIROS - TODOS
// =============================================
exports.direitos = async (req, res) => {
  try {
    const rights = await PassengerRight.findAll({
      where: { is_published: true },
      order: [['category', 'ASC'], ['display_order', 'ASC']]
    });

    // Agrupar por categoria
    const groupedRights = rights.reduce((acc, right) => {
      if (!acc[right.category]) {
        acc[right.category] = [];
      }
      acc[right.category].push(right);
      return acc;
    }, {});

    res.render('passenger-portal/public/direitos', {
      title: 'Direitos dos Passageiros',
      currentPage: 'direitos',
      user: req.session?.user || null,
      groupedRights,
      categoryConfig, // ✅ ADICIONADO
      layout: 'passenger-portal/layouts/portal-main'
    });
  } catch (error) {
    console.error('Erro ao carregar direitos:', error);
    req.flash('error', 'Erro ao carregar direitos');
    res.redirect('/portal-passageiro');
  }
};

// =============================================
// DIREITOS POR CATEGORIA - MELHORADO
// =============================================
exports.direitosByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    
    console.log('\n╔════════════════════════════════════════╗');
    console.log('║   DIREITOS POR CATEGORIA              ║');
    console.log('╚════════════════════════════════════════╝');
    console.log('📂 Categoria solicitada:', category);
    
    // Verificar se a categoria é válida
    if (!categoryConfig[category]) {
      console.log('❌ Categoria inválida:', category);
      console.log('✅ Categorias válidas:', Object.keys(categoryConfig).join(', '));
      req.flash('error', 'Categoria não encontrada');
      return res.redirect('/portal-passageiro/direitos');
    }
    
    const config = categoryConfig[category];
    console.log('✅ Configuração encontrada:', config.title);
    console.log('   Ícone:', config.icon);
    console.log('   Cor:', config.color);
    
    // Buscar direitos da categoria
    const rights = await PassengerRight.findAll({
      where: { 
        category: category,
        is_published: true 
      },
      order: [['display_order', 'ASC']]
    });

    console.log(`✅ Encontrados ${rights.length} direito(s) para a categoria "${category}"`);
    
    if (rights.length > 0) {
      console.log('📋 Direitos:');
      rights.forEach((right, index) => {
        console.log(`   ${index + 1}. ${right.title}`);
      });
    }
    console.log('════════════════════════════════════════\n');

    res.render('passenger-portal/public/direitos-category', {
      title: `${config.title} - Portal do Passageiro`,
      currentPage: 'direitos',
      user: req.session?.user || null,
      rights,
      categoryTitle: config.title,
      categorySlug: config.slug,
      categoryIcon: config.icon,
      categoryColor: config.color,
      categoryDescription: config.description,
      layout: 'passenger-portal/layouts/portal-main'
    });
  } catch (error) {
    console.error('╔════════════════════════════════════════╗');
    console.error('║   ❌ ERRO AO CARREGAR CATEGORIA       ║');
    console.error('╚════════════════════════════════════════╝');
    console.error('Erro:', error.message);
    console.error('Stack:', error.stack);
    console.error('════════════════════════════════════════\n');
    
    const { category } = req.params;
    const config = categoryConfig[category] || {
      title: 'Direitos',
      slug: category,
      icon: 'fas fa-info-circle',
      color: 'primary',
      description: 'Conheça seus direitos.'
    };
    
    req.flash('error', 'Erro ao carregar categoria');
    res.render('passenger-portal/public/direitos-category', {
      title: `${config.title} - Portal do Passageiro`,
      currentPage: 'direitos',
      user: req.session?.user || null,
      rights: [],
      categoryTitle: config.title,
      categorySlug: config.slug,
      categoryIcon: config.icon,
      categoryColor: config.color,
      categoryDescription: config.description,
      layout: 'passenger-portal/layouts/portal-main'
    });
  }
};

// =============================================
// ANTES DA VIAGEM
// =============================================
exports.antesViagem = async (req, res) => {
  try {
    const guides = await TravelGuide.findAll({
      where: { 
        phase: 'antes_viagem',
        is_published: true 
      },
      order: [['display_order', 'ASC']]
    });

    res.render('passenger-portal/public/antes-viagem', {
      title: 'Antes da Viagem',
      currentPage: 'guias',
      user: req.session?.user || null,
      guides,
      layout: 'passenger-portal/layouts/portal-main'
    });
  } catch (error) {
    console.error('Erro ao carregar guias:', error);
    req.flash('error', 'Erro ao carregar informações');
    res.redirect('/portal-passageiro');
  }
};

// =============================================
// NO AEROPORTO
// =============================================
exports.aeroporto = async (req, res) => {
  try {
    const guides = await TravelGuide.findAll({
      where: { 
        phase: 'aeroporto',
        is_published: true 
      },
      order: [['display_order', 'ASC']]
    });

    res.render('passenger-portal/public/aeroporto', {
      title: 'No Aeroporto',
      currentPage: 'guias',
      user: req.session?.user || null,
      guides,
      layout: 'passenger-portal/layouts/portal-main'
    });
  } catch (error) {
    console.error('Erro:', error);
    req.flash('error', 'Erro ao carregar informações');
    res.redirect('/portal-passageiro');
  }
};

// =============================================
// DURANTE O VOO
// =============================================
exports.duranteVoo = async (req, res) => {
  try {
    const guides = await TravelGuide.findAll({
      where: { 
        phase: 'durante_voo',
        is_published: true 
      },
      order: [['display_order', 'ASC']]
    });

    res.render('passenger-portal/public/durante-voo', {
      title: 'Durante o Voo',
      currentPage: 'guias',
      user: req.session?.user || null,
      guides,
      layout: 'passenger-portal/layouts/portal-main'
    });
  } catch (error) {
    console.error('Erro:', error);
    req.flash('error', 'Erro ao carregar informações');
    res.redirect('/portal-passageiro');
  }
};

// =============================================
// NO DESTINO
// =============================================
exports.destino = async (req, res) => {
  try {
    const guides = await TravelGuide.findAll({
      where: { 
        phase: 'destino',
        is_published: true 
      },
      order: [['display_order', 'ASC']]
    });

    res.render('passenger-portal/public/destino', {
      title: 'No Destino',
      currentPage: 'guias',
      user: req.session?.user || null,
      guides,
      layout: 'passenger-portal/layouts/portal-main'
    });
  } catch (error) {
    console.error('Erro:', error);
    req.flash('error', 'Erro ao carregar informações');
    res.redirect('/portal-passageiro');
  }
};

// =============================================
// PERGUNTAS FREQUENTES
// =============================================
exports.faq = async (req, res) => {
  try {
    const { category } = req.query;
    
    const whereClause = { is_published: true };
    if (category) {
      whereClause.category = category;
    }

    const faqs = await FAQ.findAll({
      where: whereClause,
      order: [['category', 'ASC'], ['display_order', 'ASC']]
    });

    // Agrupar por categoria
    const groupedFaqs = faqs.reduce((acc, faq) => {
      if (!acc[faq.category]) {
        acc[faq.category] = [];
      }
      acc[faq.category].push(faq);
      return acc;
    }, {});

    res.render('passenger-portal/public/faq', {
      title: 'Perguntas Frequentes',
      currentPage: 'faq',
      user: req.session?.user || null,
      groupedFaqs,
      selectedCategory: category,
      layout: 'passenger-portal/layouts/portal-main'
    });
  } catch (error) {
    console.error('Erro ao carregar FAQs:', error);
    req.flash('error', 'Erro ao carregar perguntas');
    res.redirect('/portal-passageiro');
  }
};

// =============================================
// FORMULÁRIO DE RECLAMAÇÕES
// =============================================
exports.reclamacoesForm = (req, res) => {
  res.render('passenger-portal/public/reclamacoes', {
    title: 'Registrar Reclamação',
    currentPage: 'reclamacoes',
    user: req.session?.user || null,
    layout: 'passenger-portal/layouts/portal-main'
  });
};

// =============================================
// SUBMETER RECLAMAÇÃO
// =============================================
exports.submitReclamacao = async (req, res) => {
  try {
    const {
      complaint_type,
      passenger_name,
      passenger_email,
      passenger_phone,
      flight_number,
      flight_date,
      airline,
      description
    } = req.body;

    // Validação básica
    if (!passenger_name || !passenger_email || !description) {
      req.flash('error', 'Por favor, preencha todos os campos obrigatórios');
      return res.redirect('/portal-passageiro/reclamacoes');
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(passenger_email)) {
      req.flash('error', 'Email inválido');
      return res.redirect('/portal-passageiro/reclamacoes');
    }

    await Complaint.create({
      complaint_type,
      passenger_name,
      passenger_email,
      passenger_phone,
      flight_number,
      flight_date: flight_date || null,
      airline,
      description,
      status: 'pendente',
      priority: 'media'
    });

    console.log('✅ Reclamação registrada:', {
      tipo: complaint_type,
      passageiro: passenger_name,
      email: passenger_email
    });

    req.flash('success', 'Reclamação registrada com sucesso! Entraremos em contato em breve.');
    res.redirect('/portal-passageiro/reclamacoes');
  } catch (error) {
    console.error('❌ Erro ao registrar reclamação:', error);
    req.flash('error', 'Erro ao registrar reclamação. Tente novamente.');
    res.redirect('/portal-passageiro/reclamacoes');
  }
};

// =============================================
// SIMULADOR DE DIREITOS
// =============================================
exports.simulador = (req, res) => {
  res.render('passenger-portal/public/simulador', {
    title: 'Simulador de Direitos',
    currentPage: 'simulador',
    user: req.session?.user || null,
    layout: 'passenger-portal/layouts/portal-main'
  });
};

// =============================================
// CALCULAR DIREITOS (SIMULADOR)
// =============================================
exports.calcularDireitos = async (req, res) => {
  try {
    const { tipo, distancia, atraso_horas } = req.body;

    console.log('\n╔════════════════════════════════════════╗');
    console.log('║   SIMULADOR DE DIREITOS               ║');
    console.log('╚════════════════════════════════════════╝');
    console.log('📊 Tipo:', tipo);
    console.log('📏 Distância:', distancia);
    console.log('⏰ Atraso (horas):', atraso_horas);

    // Lógica de cálculo baseada nas regras
    const resultado = {
      tipo,
      distancia,
      atraso_horas,
      tem_direito: false,
      compensacao: 0,
      assistencia: [],
      recomendacoes: []
    };

    // Cálculo baseado no tipo de problema
    if (tipo === 'atraso' && parseInt(atraso_horas) >= 3) {
      resultado.tem_direito = true;
      resultado.assistencia = ['Alimentação', 'Comunicação'];
      
      if (distancia === 'curta') resultado.compensacao = 5000;
      else if (distancia === 'media') resultado.compensacao = 10000;
      else if (distancia === 'longa') resultado.compensacao = 15000;
      
      resultado.recomendacoes = [
        'Guarde todos os documentos de viagem',
        'Tire fotos do painel de informações',
        'Peça declaração por escrito da companhia aérea',
        'Registre sua reclamação conosco'
      ];
    } else if (tipo === 'cancelamento') {
      resultado.tem_direito = true;
      resultado.assistencia = ['Reembolso integral', 'Reacomodação em outro voo'];
      
      if (distancia === 'curta') resultado.compensacao = 7500;
      else if (distancia === 'media') resultado.compensacao = 12500;
      else if (distancia === 'longa') resultado.compensacao = 20000;
      
      resultado.recomendacoes = [
        'Exija reembolso ou reacomodação imediata',
        'Solicite declaração da companhia aérea',
        'Registre reclamação formal'
      ];
    } else if (tipo === 'recusa_embarque') {
      resultado.tem_direito = true;
      resultado.assistencia = ['Compensação imediata', 'Reacomodação'];
      
      if (distancia === 'curta') resultado.compensacao = 10000;
      else if (distancia === 'media') resultado.compensacao = 15000;
      else if (distancia === 'longa') resultado.compensacao = 25000;
      
      resultado.recomendacoes = [
        'Não aceite vouchers sem garantias',
        'Exija compensação em dinheiro',
        'Documente tudo'
      ];
    } else if (tipo === 'bagagem') {
      resultado.tem_direito = true;
      resultado.assistencia = ['Kit de emergência', 'Compensação por danos'];
      resultado.compensacao = 3000;
      
      resultado.recomendacoes = [
        'Registre imediatamente com a companhia',
        'Faça inventário dos itens',
        'Guarde recibos de compras emergenciais'
      ];
    }

    console.log('✅ Resultado calculado:');
    console.log('   Tem direito:', resultado.tem_direito ? 'SIM' : 'NÃO');
    console.log('   Compensação: MT', resultado.compensacao);
    console.log('════════════════════════════════════════\n');

    res.render('passenger-portal/public/simulador-resultado', {
      title: 'Resultado do Simulador',
      currentPage: 'simulador',
      user: req.session?.user || null,
      resultado,
      layout: 'passenger-portal/layouts/portal-main'
    });
  } catch (error) {
    console.error('❌ Erro no simulador:', error);
    req.flash('error', 'Erro ao calcular direitos');
    res.redirect('/portal-passageiro/simulador');
  }
};

// =============================================
// GLOSSÁRIO
// =============================================
exports.glossario = (req, res) => {
  const termos = [
    { termo: 'Atraso de Voo', definicao: 'Situação em que o voo parte após o horário programado, podendo gerar direito a compensação se superior a 3 horas.' },
    { termo: 'Bagagem de Mão', definicao: 'Bagagem que o passageiro pode levar consigo na cabine do avião, com dimensões e peso limitados.' },
    { termo: 'Boarding Pass', definicao: 'Cartão de embarque que autoriza o passageiro a entrar na aeronave.' },
    { termo: 'Cancelamento de Voo', definicao: 'Quando o voo programado não é realizado, gerando direito a reembolso ou reacomodação.' },
    { termo: 'Check-in', definicao: 'Procedimento de confirmação de presença no voo, realizado online ou no aeroporto.' },
    { termo: 'Compensação', definicao: 'Valor em dinheiro devido ao passageiro em casos de atraso, cancelamento ou recusa de embarque.' },
    { termo: 'Conexão', definicao: 'Trecho intermediário de uma viagem com múltiplos voos.' },
    { termo: 'Franquia de Bagagem', definicao: 'Quantidade de bagagem que o passageiro pode despachar gratuitamente.' },
    { termo: 'Gate', definicao: 'Portão de embarque no aeroporto.' },
    { termo: 'No-show', definicao: 'Passageiro que não comparece ao embarque sem aviso prévio.' },
    { termo: 'Overbooking', definicao: 'Prática de vender mais bilhetes que assentos disponíveis, podendo resultar em recusa de embarque.' },
    { termo: 'Prioridade de Embarque', definicao: 'Direito de embarcar antes dos demais passageiros, concedido a certos grupos.' },
    { termo: 'Reacomodação', definicao: 'Transferência do passageiro para outro voo quando o original é cancelado.' },
    { termo: 'Recusa de Embarque', definicao: 'Negativa da companhia aérea em permitir embarque de passageiro com reserva confirmada.' },
    { termo: 'Reembolso', definicao: 'Devolução do valor pago pela passagem em caso de cancelamento ou desistência.' },
    { termo: 'Stopover', definicao: 'Parada programada durante uma viagem com pernoite.' },
    { termo: 'Tarifa', definicao: 'Preço da passagem aérea, que pode incluir diferentes condições e serviços.' },
    { termo: 'Upgrade', definicao: 'Melhoria da classe de viagem do passageiro (ex: de econômica para executiva).' },
    { termo: 'Voo Doméstico', definicao: 'Voo realizado dentro do território nacional.' },
    { termo: 'Voo Internacional', definicao: 'Voo que cruza fronteiras entre países diferentes.' }
  ];

  res.render('passenger-portal/public/glossario', {
    title: 'Glossário',
    currentPage: 'glossario',
    user: req.session?.user || null,
    termos,
    layout: 'passenger-portal/layouts/portal-main'
  });
};

// =============================================
// NOTÍCIAS DO PORTAL
// =============================================
exports.noticias = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 9;
    const offset = (page - 1) * limit;

    const { count, rows: news } = await PortalNews.findAndCountAll({
      where: { is_published: true },
      limit,
      offset,
      order: [['publishedAt', 'DESC']]
    });

    const totalPages = Math.ceil(count / limit);

    res.render('passenger-portal/public/noticias', {
      title: 'Notícias do Portal',
      currentPage: 'noticias',
      user: req.session?.user || null,
      news,
      paginationPage: page,
      totalPages,
      layout: 'passenger-portal/layouts/portal-main'
    });
  } catch (error) {
    console.error('Erro ao carregar notícias:', error);
    req.flash('error', 'Erro ao carregar notícias');
    res.redirect('/portal-passageiro');
  }
};

// =============================================
// DETALHE DE NOTÍCIA
// =============================================
exports.noticiaDetail = async (req, res) => {
  try {
    const { slug } = req.params;
    
    const noticia = await PortalNews.findOne({
      where: { slug, is_published: true }
    });

    if (!noticia) {
      req.flash('error', 'Notícia não encontrada');
      return res.redirect('/portal-passageiro/noticias');
    }

    res.render('passenger-portal/public/noticia-detail', {
      title: noticia.title,
      currentPage: 'noticias',
      user: req.session?.user || null,
      noticia,
      layout: 'passenger-portal/layouts/portal-main'
    });
  } catch (error) {
    console.error('Erro ao carregar notícia:', error);
    req.flash('error', 'Erro ao carregar notícia');
    res.redirect('/portal-passageiro/noticias');
  }
};