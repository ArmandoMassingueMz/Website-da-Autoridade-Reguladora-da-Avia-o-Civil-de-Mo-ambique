// controllers/passenger-portal/publicController.js
const { PassengerRight, FAQ, TravelGuide, Complaint, PortalNews, CompensationRule } = require('../../models');
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

    const groupedRights = rights.reduce((acc, right) => {
      if (!acc[right.category]) acc[right.category] = [];
      acc[right.category].push(right);
      return acc;
    }, {});

    res.render('passenger-portal/public/direitos', {
      title: 'Direitos dos Passageiros',
      currentPage: 'direitos',
      user: req.session?.user || null,
      groupedRights,
      categoryConfig,
      layout: 'passenger-portal/layouts/portal-main'
    });
  } catch (error) {
    console.error('Erro ao carregar direitos:', error);
    req.flash('error', 'Erro ao carregar direitos');
    res.redirect('/portal-passageiro');
  }
};

// =============================================
// DIREITOS POR CATEGORIA
// =============================================
exports.direitosByCategory = async (req, res) => {
  try {
    const { category } = req.params;

    console.log('\n╔════════════════════════════════════════╗');
    console.log('║   DIREITOS POR CATEGORIA              ║');
    console.log('╚════════════════════════════════════════╝');
    console.log('📂 Categoria solicitada:', category);

    if (!categoryConfig[category]) {
      console.log('❌ Categoria inválida:', category);
      req.flash('error', 'Categoria não encontrada');
      return res.redirect('/portal-passageiro/direitos');
    }

    const config = categoryConfig[category];
    console.log('✅ Configuração encontrada:', config.title);

    const rights = await PassengerRight.findAll({
      where: { category, is_published: true },
      order: [['display_order', 'ASC']]
    });

    console.log(`✅ Encontrados ${rights.length} direito(s) para "${category}"`);
    console.log('════════════════════════════════════════\n');

    res.render('passenger-portal/public/direitos-category', {
      title: `${config.title} - Portal do Passageiro`,
      currentPage: 'direitos',
      user: req.session?.user || null,
      rights,
      categoryTitle:       config.title,
      categorySlug:        config.slug,
      categoryIcon:        config.icon,
      categoryColor:       config.color,
      categoryDescription: config.description,
      layout: 'passenger-portal/layouts/portal-main'
    });
  } catch (error) {
    console.error('Erro ao carregar categoria:', error);
    const { category } = req.params;
    const config = categoryConfig[category] || {
      title: 'Direitos', slug: category,
      icon: 'fas fa-info-circle', color: 'primary',
      description: 'Conheça seus direitos.'
    };
    req.flash('error', 'Erro ao carregar categoria');
    res.render('passenger-portal/public/direitos-category', {
      title: `${config.title} - Portal do Passageiro`,
      currentPage: 'direitos',
      user: req.session?.user || null,
      rights: [],
      categoryTitle:       config.title,
      categorySlug:        config.slug,
      categoryIcon:        config.icon,
      categoryColor:       config.color,
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
      where: { phase: 'antes_viagem', is_published: true },
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
      where: { phase: 'aeroporto', is_published: true },
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
      where: { phase: 'durante_voo', is_published: true },
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
      where: { phase: 'destino', is_published: true },
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
    if (category) whereClause.category = category;

    const faqs = await FAQ.findAll({
      where: whereClause,
      order: [['category', 'ASC'], ['display_order', 'ASC']]
    });

    const groupedFaqs = faqs.reduce((acc, faq) => {
      if (!acc[faq.category]) acc[faq.category] = [];
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

    if (!passenger_name || !passenger_email || !description) {
      req.flash('error', 'Por favor, preencha todos os campos obrigatórios');
      return res.redirect('/portal-passageiro/reclamacoes');
    }

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

    console.log('✅ Reclamação registrada:', { tipo: complaint_type, passageiro: passenger_name });

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
// CALCULAR DIREITOS (SIMULADOR) — usa BD
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

    const resultado = {
      tipo,
      distancia,
      atraso_horas,
      tem_direito:     false,
      compensacao:     0,
      currency:        'MZN',
      legal_reference: null,
      conditions:      null,
      assistencia:     [],
      recomendacoes:   []
    };

    // ─── Montar filtro para pesquisa na BD ───────────────────
    const whereClause = {
      rule_type:         tipo,
      distance_category: distancia,
      is_active:         true
    };

    // Para atraso: só aplicar regras cujo delay_hours mínimo
    // seja <= ao atraso informado pelo passageiro
    if (tipo === 'atraso' && atraso_horas) {
      whereClause.delay_hours = { [Op.lte]: parseInt(atraso_horas) };
    }

    // Buscar a regra mais específica activa (maior delay_hours aplicável)
    const rule = await CompensationRule.findOne({
      where: whereClause,
      order: [['delay_hours', 'DESC']]
    });

    console.log('🔍 Regra BD:', rule
      ? `ID ${rule.id} — ${rule.compensation_amount} ${rule.currency}`
      : 'Nenhuma regra encontrada');

    if (rule) {
      // ── TEM DIREITO — valores vêm da BD ──────────────────────
      resultado.tem_direito    = true;
      resultado.compensacao    = parseFloat(rule.compensation_amount);
      resultado.currency       = rule.currency || 'MZN';
      resultado.legal_reference = rule.legal_reference || null;
      resultado.conditions     = rule.conditions || null;

      // Assistência por tipo (lógica de negócio fixa)
      const assistenciaMap = {
        atraso:          ['Alimentação e bebidas', 'Comunicação (chamada ou e-mail)', 'Alojamento se necessário'],
        cancelamento:    ['Reembolso integral da passagem', 'Reacomodação em voo alternativo', 'Alojamento e refeições se aplicável'],
        recusa_embarque: ['Compensação financeira imediata', 'Reacomodação no próximo voo disponível', 'Refeições e comunicação'],
        bagagem:         ['Kit de emergência (higiene básica)', 'Compensação por danos ou extravio', 'Reembolso de compras essenciais']
      };

      // Recomendações por tipo
      const recomendacoesMap = {
        atraso: [
          'Guarde o cartão de embarque e todos os documentos de viagem',
          'Fotografe o painel de informações com o atraso registado',
          'Solicite declaração por escrito à companhia aérea',
          'Registe a sua reclamação no Portal do Passageiro'
        ],
        cancelamento: [
          'Exija reembolso integral ou reacomodação imediata',
          'Solicite declaração escrita da companhia com o motivo',
          'Não aceite vouchers sem garantias claras',
          'Submeta reclamação formal ao IACM'
        ],
        recusa_embarque: [
          'Não abandone o balcão sem documentação escrita',
          'Exija compensação em numerário, não apenas vouchers',
          'Documente tudo com fotografias e testemunhas',
          'Registe reclamação formal no Portal do Passageiro'
        ],
        bagagem: [
          'Reporte imediatamente ao balcão da companhia no aeroporto (PIR)',
          'Guarde todos os recibos de compras de emergência',
          'Faça o inventário detalhado dos itens em falta ou danificados',
          'Submeta reclamação no prazo máximo de 7 dias'
        ]
      };

      resultado.assistencia   = assistenciaMap[tipo]   || [];
      resultado.recomendacoes = recomendacoesMap[tipo] || [];

    } else {
      // ── SEM DIREITO ou regra não configurada na BD ───────────
      resultado.tem_direito   = false;
      resultado.compensacao   = 0;
      resultado.recomendacoes = [
        'Consulte a página de Direitos do Passageiro para mais informações',
        'Em caso de dúvida, submeta uma reclamação e a DRETA analisará o seu caso'
      ];
    }

    console.log('✅ Resultado calculado:');
    console.log('   Tem direito:', resultado.tem_direito ? 'SIM' : 'NÃO');
    console.log('   Compensação:', resultado.compensacao, resultado.currency);
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
    { termo: 'Atraso de Voo',         definicao: 'Situação em que o voo parte após o horário programado, podendo gerar direito a compensação se superior a 3 horas.' },
    { termo: 'Bagagem de Mão',        definicao: 'Bagagem que o passageiro pode levar consigo na cabine do avião, com dimensões e peso limitados.' },
    { termo: 'Boarding Pass',         definicao: 'Cartão de embarque que autoriza o passageiro a entrar na aeronave.' },
    { termo: 'Cancelamento de Voo',   definicao: 'Quando o voo programado não é realizado, gerando direito a reembolso ou reacomodação.' },
    { termo: 'Check-in',              definicao: 'Procedimento de confirmação de presença no voo, realizado online ou no aeroporto.' },
    { termo: 'Compensação',           definicao: 'Valor em dinheiro devido ao passageiro em casos de atraso, cancelamento ou recusa de embarque.' },
    { termo: 'Conexão',               definicao: 'Trecho intermediário de uma viagem com múltiplos voos.' },
    { termo: 'Franquia de Bagagem',   definicao: 'Quantidade de bagagem que o passageiro pode despachar gratuitamente.' },
    { termo: 'Gate',                  definicao: 'Portão de embarque no aeroporto.' },
    { termo: 'No-show',               definicao: 'Passageiro que não comparece ao embarque sem aviso prévio.' },
    { termo: 'Overbooking',           definicao: 'Prática de vender mais bilhetes que assentos disponíveis, podendo resultar em recusa de embarque.' },
    { termo: 'Prioridade de Embarque',definicao: 'Direito de embarcar antes dos demais passageiros, concedido a certos grupos.' },
    { termo: 'Reacomodação',          definicao: 'Transferência do passageiro para outro voo quando o original é cancelado.' },
    { termo: 'Recusa de Embarque',    definicao: 'Negativa da companhia aérea em permitir embarque de passageiro com reserva confirmada.' },
    { termo: 'Reembolso',             definicao: 'Devolução do valor pago pela passagem em caso de cancelamento ou desistência.' },
    { termo: 'Stopover',              definicao: 'Parada programada durante uma viagem com pernoite.' },
    { termo: 'Tarifa',                definicao: 'Preço da passagem aérea, que pode incluir diferentes condições e serviços.' },
    { termo: 'Upgrade',               definicao: 'Melhoria da classe de viagem do passageiro (ex: de econômica para executiva).' },
    { termo: 'Voo Doméstico',         definicao: 'Voo realizado dentro do território nacional.' },
    { termo: 'Voo Internacional',     definicao: 'Voo que cruza fronteiras entre países diferentes.' }
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
    const page   = parseInt(req.query.page) || 1;
    const limit  = 9;
    const offset = (page - 1) * limit;

    const { count, rows: news } = await PortalNews.findAndCountAll({
      where:  { is_published: true },
      limit,
      offset,
      order:  [['publishedAt', 'DESC']]
    });

    res.render('passenger-portal/public/noticias', {
      title: 'Notícias do Portal',
      currentPage: 'noticias',
      user: req.session?.user || null,
      news,
      paginationPage: page,
      totalPages:     Math.ceil(count / limit),
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