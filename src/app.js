const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const session = require('express-session');
const flash = require('connect-flash');
const path = require('path');
const i18n = require('i18n');
const cookieParser = require('cookie-parser');
require('dotenv').config();

// Importar configuração da base de dados
const { testConnection } = require('./config/database');

// =============================================
// IMPORTAR MODELOS COM ASSOCIAÇÕES
// =============================================
const { 
  User, 
  News, 
  Event, 
  Regulation, 
  EconomicRegulation, 
  Contact, 
  Accident, 
  InternationalCooperation, 
  Staff, 
  Law,
  OtherService,
  TeamMember, // ← ADICIONADO
  // Portal do Passageiro
  PassengerRight,
  FAQ,
  TravelGuide,
  Complaint,
  CompensationRule,
  PortalNews
} = require('./models');

// Importar middleware
const { requireAuth, requireRole, userToLocals } = require('./middleware/auth');

const app = express();

// Testar conexão com a base de dados
testConnection();

// =============================================
// CONFIGURAÇÃO DE INTERNACIONALIZAÇÃO (i18n)
// =============================================

i18n.configure({
  locales: ['pt', 'en'],
  directory: path.join(__dirname, 'locales'),
  defaultLocale: 'pt',
  cookie: 'lang',
  objectNotation: true,
  autoReload: true,
  syncFiles: true,
  queryParameter: 'lang',
  register: global
});

// =============================================
// CONFIGURAÇÕES DO EXPRESS
// =============================================

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser());

// Configuração do EJS
app.use(expressLayouts);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('layout', 'layouts/main');

// =============================================
// MIDDLEWARES
// =============================================

// Internacionalização
app.use(i18n.init);

// Middleware para definir locale baseado no cookie
app.use((req, res, next) => {
  if (!req.cookies.lang) {
    req.setLocale('pt');
    res.cookie('lang', 'pt', { 
      maxAge: 365 * 24 * 60 * 60 * 1000,
      httpOnly: true 
    });
  } else {
    req.setLocale(req.cookies.lang);
  }
  
  res.locals.currentLocale = req.getLocale();
  next();
});

// =============================================
// SERVIR FICHEIROS ESTÁTICOS
// =============================================

// Pasta pública geral
app.use(express.static(path.join(__dirname, 'public')));

// Admin também pode acessar arquivos estáticos
app.use('/admin', express.static(path.join(__dirname, 'public')));

// UPLOADS - Servir todos os diretórios de upload
app.use('/uploads/news', express.static(path.join(__dirname, 'public/uploads/news')));
app.use('/uploads/regulations', express.static(path.join(__dirname, 'public/uploads/regulations')));
app.use('/uploads/economic-regulations', express.static(path.join(__dirname, 'public/uploads/economic-regulations')));
app.use('/uploads/accidents', express.static(path.join(__dirname, 'public/uploads/accidents')));
app.use('/uploads/cooperations', express.static(path.join(__dirname, 'public/uploads/cooperations')));
app.use('/uploads/staff', express.static(path.join(__dirname, 'public/uploads/staff')));
app.use('/uploads/laws', express.static(path.join(__dirname, 'public/uploads/laws')));
app.use('/uploads/forms', express.static(path.join(__dirname, 'public/uploads/forms')));
app.use('/uploads/other-services', express.static(path.join(__dirname, 'public/uploads/other-services')));
app.use('/uploads/team', express.static(path.join(__dirname, 'public/uploads/team'))); // ← ADICIONADO

// PORTAL DO PASSAGEIRO - Uploads
app.use('/uploads/passenger-portal', express.static(path.join(__dirname, 'public/uploads/passenger-portal')));

// =============================================
// SESSÕES E FLASH MESSAGES
// =============================================

app.use(session({
  secret: process.env.SESSION_SECRET || 'iacm-super-secret-key-2024',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 
  }
}));

// Flash messages
app.use(flash());

// Middleware customizado
app.use(userToLocals);

// Middleware para valores padrão das views
app.use((req, res, next) => {
  res.locals.currentPage = '';
  res.locals.__ = res.__;
  next();
});

// Middleware para flash messages em todas as views
app.use((req, res, next) => {
  res.locals.messages = {
    error: req.flash('error'),
    success: req.flash('success')
  };
  next();
});

// =============================================
// ROTA PARA MUDANÇA DE IDIOMA
// =============================================

app.get('/change-locale/:lang', (req, res) => {
  const { lang } = req.params;
  const supportedLocales = ['pt', 'en'];
  
  if (supportedLocales.includes(lang)) {
    res.cookie('lang', lang, { 
      maxAge: 365 * 24 * 60 * 60 * 1000,
      httpOnly: true 
    });
    
    const referer = req.get('Referer') || '/';
    res.redirect(referer);
  } else {
    res.redirect('/');
  }
});

// =============================================
// ROTAS PÚBLICAS
// =============================================

// Página inicial
app.get('/', async (req, res) => {
  try {
    console.log('\n=== ROTA HOME - INÍCIO ===');

    await Event.deactivateExpiredEvents();

    const featuredNews = await News.findAll({
      where: { isPublished: true },
      include: [{ model: User, as: 'author' }],
      order: [['createdAt', 'DESC']],
      limit: 3
    });

    console.log(`✅ Notícias encontradas: ${featuredNews.length}`);

    const featuredEvents = await Event.findAll({
      where: { 
        isPublished: true,
        isActive: true
      },
      include: [{ model: User, as: 'author' }],
      order: [['startDate', 'ASC']],
      limit: 5
    });

    console.log(`✅ Eventos encontrados: ${featuredEvents.length}`);

    const newsArray = featuredNews.map(news => {
      const n = news.get({ plain: true });
      return {
        type: 'news',
        id: n.id,
        title: n.title,
        slug: n.slug,
        excerpt: n.excerpt,
        featuredImage: n.featuredImage,
        publishedAt: n.publishedAt,
        createdAt: n.createdAt
      };
    });

    const eventsArray = featuredEvents.map(event => {
      const e = event.get({ plain: true });
      return {
        type: 'event',
        id: e.id,
        title: e.title,
        slug: e.slug || e.id,
        description: e.description,
        featuredImage: e.featuredImage,
        startDate: e.startDate,
        endDate: e.endDate,
        location: e.location || 'A definir'
      };
    });

    // INTERCALAR notícias e eventos
    const allItems = [];
    const maxLength = Math.max(newsArray.length, eventsArray.length);
    for (let i = 0; i < maxLength; i++) {
      if (i < newsArray.length) allItems.push(newsArray[i]);
      if (i < eventsArray.length) allItems.push(eventsArray[i]);
    }

    res.render('pages/home', { 
      title: 'IACM - Autoridade de Aviação Civil de Moçambique',
      currentPage: 'home',
      featuredNews: newsArray,
      featuredEvents: eventsArray,
      allItems: allItems
    });

  } catch (error) {
    console.error('❌ Erro ao carregar página inicial:', error);
    res.render('pages/home', { 
      title: 'IACM - Autoridade de Aviação Civil de Moçambique',
      currentPage: 'home',
      featuredNews: [],
      featuredEvents: [],
      allItems: []
    });
  }
});

// =============================================
// ROTA: SOBRE NÓS
// ← Rota duplicada removida. Esta é a única rota /sobre.
// =============================================
app.get('/sobre', async (req, res) => {
  try {
    const team = await TeamMember.findAll({
      where: { isActive: true },
      order: [
        ['displayOrder', 'ASC'],
        ['name', 'ASC']
      ]
    });

    console.log(`✅ Equipe de Liderança carregada: ${team.length} membro(s)`);

    res.render('pages/sobre', {
      title: 'Sobre Nós - IACM',
      currentPage: 'sobre',
      team
    });
  } catch (error) {
    console.error('❌ Erro ao carregar equipe:', error);
    res.render('pages/sobre', {
      title: 'Sobre Nós - IACM',
      currentPage: 'sobre',
      team: []
    });
  }
});

// =============================================
// ROTA: SERVIÇOS
// =============================================
app.get('/servicos', async (req, res) => {
  try {
    const regulations = await Regulation.findAll({
      where: { isPublished: true },
      order: [['type', 'ASC'], ['publicationDate', 'DESC']]
    });

    const economicRegulations = await EconomicRegulation.findAll({
      where: { isActive: true },
      order: [['type', 'ASC'], ['publicationDate', 'DESC']],
      attributes: { exclude: ['createdBy'] }
    });

    const accidents = await Accident.findAll({
      where: { isPublished: true },
      order: [['year', 'DESC'], ['quarter', 'DESC']],
      limit: 20
    });

    const cooperations = await InternationalCooperation.findAll({
      where: { isPublished: true },
      order: [['date', 'DESC']],
      limit: 20
    });

    let laws = [];
    try {
      laws = await Law.findAll({
        where: { isPublished: true },
        order: [['ord', 'ASC']]
      });
    } catch (lawError) {
      console.log('⚠️ Aviso: Erro ao buscar leis:', lawError.message);
    }

    let otherServices = [];
    try {
      otherServices = await OtherService.findAll({
        where: { isActive: true },
        order: [['serviceName', 'ASC'], ['displayOrder', 'ASC']]
      });
    } catch (otherError) {
      console.log('⚠️ Aviso: Erro ao buscar outros serviços:', otherError.message);
    }

    const regulationsByType = {};
    regulations.forEach(regulation => {
      if (!regulationsByType[regulation.type]) regulationsByType[regulation.type] = [];
      regulationsByType[regulation.type].push(regulation);
    });

    const economicRegulationsByType = {};
    economicRegulations.forEach(regulation => {
      if (!economicRegulationsByType[regulation.type]) economicRegulationsByType[regulation.type] = [];
      economicRegulationsByType[regulation.type].push(regulation);
    });

    res.render('pages/servicos', {
      title: 'Serviços - IACM',
      currentPage: 'servicos',
      regulationsByType,
      economicRegulationsByType,
      accidents,
      cooperations,
      laws,
      otherServices
    });
  } catch (error) {
    console.error('Erro ao carregar serviços:', error);
    res.render('pages/servicos', {
      title: 'Serviços - IACM',
      currentPage: 'servicos',
      regulationsByType: {},
      economicRegulationsByType: {},
      accidents: [],
      cooperations: [],
      laws: [],
      otherServices: []
    });
  }
});

// =============================================
// ROTA: CONTACTOS
// =============================================
app.get('/contactos', (req, res) => {
  res.render('pages/contactos', {
    title: 'Contactos - IACM',
    currentPage: 'contactos'
  });
});

// =============================================
// ROTA: NOTÍCIAS
// =============================================
app.get('/noticias', async (req, res) => {
  try {
    const news = await News.findAll({
      where: { isPublished: true },
      include: [{ model: User, as: 'author' }],
      order: [['createdAt', 'DESC']]
    });

    res.render('pages/noticias', {
      title: 'Notícias - IACM',
      currentPage: 'noticias',
      news
    });
  } catch (error) {
    console.error('Erro ao carregar notícias:', error);
    req.flash('error', 'Erro ao carregar notícias');
    res.render('pages/noticias', {
      title: 'Notícias - IACM',
      currentPage: 'noticias',
      news: []
    });
  }
});

// =============================================
// ROTA: EVENTOS (lista)
// =============================================
app.get('/eventos', async (req, res) => {
  try {
    await Event.deactivateExpiredEvents();

    const events = await Event.findAll({
      where: { isPublished: true, isActive: true },
      include: [{ model: User, as: 'author' }],
      order: [['startDate', 'ASC']]
    });

    res.render('pages/events/list', {
      title: 'Eventos - IACM',
      currentPage: 'eventos',
      events
    });
  } catch (error) {
    console.error('Erro ao carregar eventos:', error);
    req.flash('error', 'Erro ao carregar eventos');
    res.render('pages/events/list', {
      title: 'Eventos - IACM',
      currentPage: 'eventos',
      events: []
    });
  }
});

// =============================================
// ROTA: DETALHE DO EVENTO
// =============================================
app.get('/eventos/:id', async (req, res) => {
  try {
    const event = await Event.findOne({
      where: { id: req.params.id, isPublished: true, isActive: true },
      include: [{ model: User, as: 'author' }]
    });

    if (!event) {
      req.flash('error', 'Evento não encontrado');
      return res.redirect('/eventos');
    }

    res.render('pages/events/show', {
      title: `${event.title} - IACM`,
      currentPage: 'eventos',
      event
    });
  } catch (error) {
    console.error('Erro ao carregar evento:', error);
    req.flash('error', 'Erro ao carregar evento');
    res.redirect('/eventos');
  }
});

// =============================================
// ROTA: LEGISLAÇÃO E REGULAMENTAÇÃO
// =============================================
app.get('/legislacao', async (req, res) => {
  try {
    const regulations = await Regulation.findAll({
      where: { isPublished: true },
      order: [['type', 'ASC'], ['publicationDate', 'DESC']]
    });

    let laws = [];
    try {
      laws = await Law.findAll({
        where: { isPublished: true },
        order: [['ord', 'ASC']]
      });
    } catch (lawError) {
      console.log('⚠️ Aviso: Erro ao buscar leis:', lawError.message);
    }

    const regulationsByType = {};
    regulations.forEach(regulation => {
      if (!regulationsByType[regulation.type]) regulationsByType[regulation.type] = [];
      regulationsByType[regulation.type].push(regulation);
    });

    res.render('pages/legislacao', {
      title: 'Legislação e Regulamentação - IACM',
      currentPage: 'legislacao',
      regulationsByType,
      laws
    });
  } catch (error) {
    console.error('Erro ao carregar legislação:', error);
    res.render('pages/legislacao', {
      title: 'Legislação e Regulamentação - IACM',
      currentPage: 'legislacao',
      regulationsByType: {},
      laws: []
    });
  }
});

// =============================================
// ROTA: ÁREAS/SECTORES
// =============================================
app.get('/areas-sectores', async (req, res) => {
  try {
    console.log('\n=== ROTA ÁREAS/SECTORES - INÍCIO ===');

    let otherServices = [];
    try {
      otherServices = await OtherService.findAll({
        where: { isActive: true },
        order: [['serviceName', 'ASC'], ['displayOrder', 'ASC']]
      });
      console.log(`✅ Outros serviços encontrados: ${otherServices.length}`);
    } catch (otherError) {
      console.log('⚠️ Erro ao buscar outros serviços:', otherError.message);
    }

    res.render('pages/areas-sectores', {
      title: 'Áreas/Sectores - IACM',
      currentPage: 'areas-sectores',
      otherServices
    });
  } catch (error) {
    console.error('❌ Erro ao carregar áreas/sectores:', error);
    res.render('pages/areas-sectores', {
      title: 'Áreas/Sectores - IACM',
      currentPage: 'areas-sectores',
      otherServices: []
    });
  }
});

// =============================================
// ROTA PÚBLICA DE CONTACTOS (FORMULÁRIO)
// =============================================
app.use('/contact', require('./routes/contact'));

// =============================================
// ROTAS DO PORTAL DO PASSAGEIRO
// =============================================
app.use('/portal-passageiro', require('./routes/passenger-portal'));
app.use('/portal-passageiro/admin', require('./routes/passenger-portal/admin'));

// =============================================
// ROTAS DE AUTENTICAÇÃO E ADMINISTRAÇÃO
// =============================================

app.use('/auth', require('./routes/auth'));
app.use('/admin', require('./routes/admin'));
app.use('/admin/contacts', require('./routes/contact'));
app.use('/admin/news', require('./routes/news'));
app.use('/admin/regulations', require('./routes/regulations'));
app.use('/admin/laws', require('./routes/laws'));
app.use('/admin/economic-regulations', require('./routes/economic-regulations'));
app.use('/admin/events', require('./routes/events'));
app.use('/admin/accidents', require('./routes/accidents'));
app.use('/admin/cooperations', require('./routes/cooperations'));
app.use('/admin/staff', require('./routes/staff'));
app.use('/admin/forms', require('./routes/forms'));
app.use('/admin/other-services', require('./routes/other-services'));
app.use('/admin/team-members', require('./routes/team-members')); // ← ADICIONADO

// =============================================
// MIDDLEWARES DE ERRO
// =============================================

app.use((req, res) => {
  res.status(404).render('pages/404', { 
    title: 'Página Não Encontrada - IACM',
    currentPage: '404'
  });
});

app.use((err, req, res, next) => {
  console.error('Erro:', err.stack);
  res.status(500).render('pages/error', { 
    title: 'Erro - IACM',
    error: err,
    currentPage: 'error'
  });
});

// =============================================
// INICIAR SERVIDOR
// =============================================

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor IACM rodando na porta ${PORT}`);
  console.log(`🔐 Sistema de autenticação activo`);
  console.log(`🌐 Sistema de internacionalização activo`);
  console.log(`📍 Idioma padrão: Português`);
  console.log(`🌐 Acesse: http://localhost:${PORT}`);
  console.log(`📰 Notícias: http://localhost:${PORT}/noticias`);
  console.log(`📅 Eventos: http://localhost:${PORT}/eventos`);
  console.log(`📋 Serviços: http://localhost:${PORT}/servicos`);
  console.log(`🏢 Áreas/Sectores: http://localhost:${PORT}/areas-sectores`);
  console.log(`📞 Contactos: http://localhost:${PORT}/contactos`);
  console.log(`⚙️  Admin: http://localhost:${PORT}/admin`);
  console.log(`✈️  Portal do Passageiro: http://localhost:${PORT}/portal-passageiro`);
  console.log(`✈️  Admin Portal: http://localhost:${PORT}/portal-passageiro/admin`);
  console.log(`👥 Equipe de Liderança: http://localhost:${PORT}/sobre`);
});

module.exports = app;
