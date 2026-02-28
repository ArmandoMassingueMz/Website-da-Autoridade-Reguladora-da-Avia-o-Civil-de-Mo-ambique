const { sequelize } = require('../config/database');

// =============================================
// IMPORTAR TODOS OS MODELOS
// =============================================
const User = require('./User');
const News = require('./News');
const Event = require('./Event');
const Regulation = require('./Regulation');
const EconomicRegulation = require('./EconomicRegulation');
const Contact = require('./Contact');
const Accident = require('./Accident');
const InternationalCooperation = require('./InternationalCooperation');
const Staff = require('./Staff');
const Law = require('./Law');
const Form = require('./Form');
const OtherService = require('./OtherService');
const TeamMember = require('./TeamMember');
// =============================================
// IMPORTAR MODELOS DO PORTAL DO PASSAGEIRO
// =============================================
const PassengerRight = require('./passenger-portal/PassengerRight');
const FAQ = require('./passenger-portal/FAQ');
const TravelGuide = require('./passenger-portal/TravelGuide');
const Complaint = require('./passenger-portal/Complaint');
const CompensationRule = require('./passenger-portal/CompensationRule');
const PortalNews = require('./passenger-portal/PortalNews');

// =============================================
// LOG DE DEBUG
// =============================================
console.log('📦 Modelos carregados:', [
  'User',
  'News',
  'Event',
  'Regulation',
  'EconomicRegulation',
  'Contact',
  'Accident',
  'InternationalCooperation',
  'Staff',
  'Law',
  'Form',
  'OtherService',
  'TeamMember'
]);

// =============================================
// ASSOCIAÇÕES - NEWS
// =============================================
News.belongsTo(User, {
  foreignKey: 'authorId',
  as: 'author'
});

User.hasMany(News, {
  foreignKey: 'authorId',
  as: 'news'
});

TeamMember.belongsTo(User, {
  foreignKey: 'authorId',
  as: 'author'
});

User.hasMany(TeamMember, {
  foreignKey: 'authorId',
  as: 'teamMembers'
});
// =============================================
// ASSOCIAÇÕES - EVENT
// =============================================
Event.belongsTo(User, {
  foreignKey: 'authorId',
  as: 'author'
});

User.hasMany(Event, {
  foreignKey: 'authorId',
  as: 'events'
});

// =============================================
// ASSOCIAÇÕES - REGULATION
// =============================================
if (Regulation) {
  Regulation.belongsTo(User, {
    foreignKey: 'authorId',
    as: 'author'
  });
  
  User.hasMany(Regulation, {
    foreignKey: 'authorId',
    as: 'regulations'
  });
}

// =============================================
// ASSOCIAÇÕES - ECONOMIC REGULATION
// =============================================
if (EconomicRegulation) {
  EconomicRegulation.belongsTo(User, {
    foreignKey: 'authorId',
    as: 'author'
  });
  
  User.hasMany(EconomicRegulation, {
    foreignKey: 'authorId',
    as: 'economicRegulations'
  });
}

// =============================================
// ASSOCIAÇÕES - ACCIDENT
// =============================================
Accident.belongsTo(User, {
  foreignKey: 'authorId',
  as: 'author'
});

User.hasMany(Accident, {
  foreignKey: 'authorId',
  as: 'accidents'
});

// =============================================
// ASSOCIAÇÕES - INTERNATIONAL COOPERATION
// =============================================
InternationalCooperation.belongsTo(User, {
  foreignKey: 'authorId',
  as: 'author'
});

User.hasMany(InternationalCooperation, {
  foreignKey: 'authorId',
  as: 'cooperations'
});

// =============================================
// ASSOCIAÇÕES - STAFF
// ✅ REMOVIDO - A tabela staff NÃO tem campo createdBy
// =============================================
// Staff não precisa de associação com User

// =============================================
// ASSOCIAÇÕES - LAW
// =============================================
Law.belongsTo(User, { 
  foreignKey: 'authorId',
  as: 'author'
});

User.hasMany(Law, {
  foreignKey: 'authorId',
  as: 'laws'
});

// =============================================
// ASSOCIAÇÕES - FORM
// =============================================
Form.belongsTo(User, {
  foreignKey: 'authorId',
  as: 'author'
});

User.hasMany(Form, {
  foreignKey: 'authorId',
  as: 'forms'
});

// =============================================
// ASSOCIAÇÕES - OTHER SERVICE
// =============================================
OtherService.belongsTo(User, { 
  foreignKey: 'authorId',
  as: 'author'
});

User.hasMany(OtherService, { 
  foreignKey: 'authorId',
  as: 'otherServices' 
});

// =============================================
// ASSOCIAÇÕES - PORTAL DO PASSAGEIRO
// =============================================
PassengerRight.belongsTo(User, { foreignKey: 'authorId', as: 'author' });
User.hasMany(PassengerRight, { foreignKey: 'authorId', as: 'passengerRights' });

FAQ.belongsTo(User, { foreignKey: 'authorId', as: 'author' });
User.hasMany(FAQ, { foreignKey: 'authorId', as: 'faqs' });

TravelGuide.belongsTo(User, { foreignKey: 'authorId', as: 'author' });
User.hasMany(TravelGuide, { foreignKey: 'authorId', as: 'travelGuides' });

CompensationRule.belongsTo(User, { foreignKey: 'authorId', as: 'author' });
User.hasMany(CompensationRule, { foreignKey: 'authorId', as: 'compensationRules' });

PortalNews.belongsTo(User, { foreignKey: 'authorId', as: 'author' });
User.hasMany(PortalNews, { foreignKey: 'authorId', as: 'portalNews' });

console.log('🔗 Associações do Portal do Passageiro criadas!');

// =============================================
// LOG DE SUCESSO
// =============================================
console.log('🔗 Associações criadas com sucesso!');

// =============================================
// EXPORTAR MODELOS
// =============================================
module.exports = {
  sequelize,
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
  Form,
  OtherService,
  TeamMember,
  // Portal do Passageiro
  PassengerRight,
  FAQ,
  TravelGuide,
  Complaint,
  CompensationRule,
  PortalNews
};