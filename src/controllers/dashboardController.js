// controllers/dashboardController.js
const { Op } = require('sequelize');
const News = require('../models/News');
const Event = require('../models/Event');
const User = require('../models/User');
const Regulation = require('../models/Regulation');
const EconomicRegulation = require('../models/EconomicRegulation');
const Contact = require('../models/Contact');
const Accident = require('../models/Accident');
const InternationalCooperation = require('../models/InternationalCooperation');
const Form = require('../models/Form');
const { sequelize } = require('../config/database');

exports.dashboard = async (req, res) => {
    try {
        const currentUser = req.session.user || req.user;
        
        if (!currentUser) {
            req.flash('error', 'Sessão expirada. Faça login novamente.');
            return res.redirect('/auth/login');
        }

        // Contar notícias
        const totalNews = await News.count();
        const publishedNews = await News.count({ where: { isPublished: true } });

        // Contar eventos
        const totalEvents = await Event.count();

        // Buscar notícias recentes
        const recentNews = await News.findAll({
            include: [{
                model: User,
                as: 'author',
                attributes: ['name']
            }],
            order: [['createdAt', 'DESC']],
            limit: 5
        });

        // Contar usuários (apenas para admin)
        let totalUsers = null;
        if (currentUser.role === 'admin' || currentUser.role === 'super_admin') {
            totalUsers = await User.count();
        }

        // Contar regulamentos, acidentes, cooperações (apenas para admin)
        let totalRegulations = null;
        let totalEconomicRegulations = null;
        let totalAccidents = null;
        let totalCooperations = null;
        let totalForms = 0;
        
        if (currentUser.role === 'admin' || currentUser.role === 'super_admin') {
            totalRegulations = await Regulation.count();
            totalEconomicRegulations = await EconomicRegulation.count();
            totalAccidents = await Accident.count({ where: { isPublished: true } });
            totalCooperations = await InternationalCooperation.count({ where: { isPublished: true } });
            
            // Verificar se a tabela forms existe
            try {
                const [tableExists] = await sequelize.query("SHOW TABLES LIKE 'forms'");
                
                if (tableExists.length > 0) {
                    totalForms = await Form.count();
                    console.log(`✅ Tabela forms encontrada. Total: ${totalForms}`);
                } else {
                    console.log('⚠️ Tabela forms ainda não existe. Usando 0.');
                }
            } catch (formError) {
                console.log('⚠️ Erro ao verificar tabela forms:', formError.message);
            }
        }

        // =============================================
        // CONTACTOS - ESTATÍSTICAS E DADOS RECENTES
        // =============================================
        
        let contactStats = {
            total: 0,
            novos: 0,
            naoLidos: 0,
            respondidos: 0,
            pendentes: 0
        };
        
        let recentContacts = [];
        
        try {
            // Obter estatísticas de contactos
            const totalContacts = await Contact.count();
            const novosContacts = await Contact.count({ 
                where: { status: 'novo' } 
            });
            const unreadContacts = await Contact.count({ 
                where: { isRead: false } 
            });
            const repliedContacts = await Contact.count({ 
                where: { isReplied: true } 
            });

            contactStats = {
                total: totalContacts,
                novos: novosContacts,
                naoLidos: unreadContacts,
                respondidos: repliedContacts,
                pendentes: totalContacts - repliedContacts
            };

            console.log('📧 Estatísticas de contactos:', contactStats);

            // ✅ BUSCAR CONTACTOS RECENTES (INCLUINDO O CAMPO MENSAGEM)
            recentContacts = await Contact.findAll({
                order: [['createdAt', 'DESC']],
                limit: 5,
                attributes: ['id', 'nome', 'email', 'telefone', 'assunto', 'mensagem', 'status', 'isRead', 'createdAt']
            });

            // ✅ GARANTIR QUE MENSAGEM EXISTE EM CADA CONTACTO
            recentContacts = recentContacts.map(contact => {
                const c = contact.get({ plain: true });
                // Se mensagem não existe ou é null, usar texto padrão
                if (!c.mensagem || c.mensagem === null || c.mensagem.trim() === '') {
                    c.mensagem = 'Sem mensagem disponível';
                }
                return c;
            });

            console.log(`📬 Contactos recentes encontrados: ${recentContacts.length}`);

        } catch (contactError) {
            console.error('⚠️ Erro ao carregar dados de contactos:', contactError);
            // Em caso de erro, usar array vazio
            recentContacts = [];
        }

        // =============================================
        // BUSCAR FORMULÁRIOS RECENTES (apenas para admin)
        // =============================================
        let recentForms = [];
        if (currentUser.role === 'admin' || currentUser.role === 'super_admin') {
            try {
                const [tableExists] = await sequelize.query("SHOW TABLES LIKE 'forms'");
                
                if (tableExists.length > 0) {
                    recentForms = await Form.findAll({
                        order: [['createdAt', 'DESC']],
                        limit: 5,
                        attributes: ['id', 'formNumber', 'title', 'category', 'downloadCount', 'isPublished', 'createdAt']
                    });
                    console.log(`📋 Formulários recentes encontrados: ${recentForms.length}`);
                }
            } catch (formsError) {
                console.error('⚠️ Erro ao carregar formulários recentes:', formsError);
            }
        }

        // Renderizar o dashboard com TODAS as variáveis necessárias
        res.render('admin/dashboard', {
            title: 'Dashboard',
            
            // Variáveis principais
            newsCount: totalNews,
            eventsCount: totalEvents,
            usersCount: totalUsers || 0,
            regulationsCount: totalRegulations || 0,
            economicRegulationsCount: totalEconomicRegulations || 0,
            accidentsCount: totalAccidents || 0,
            cooperationsCount: totalCooperations || 0,
            formsCount: totalForms,
            
            // Variáveis alternativas
            publishedNewsCount: publishedNews,
            eventCount: totalEvents,
            userCount: totalUsers || 0,
            regulationCount: totalRegulations || 0,
            economicRegulationCount: totalEconomicRegulations || 0,
            accidentCount: totalAccidents || 0,
            cooperationCount: totalCooperations || 0,
            formCount: totalForms,
            
            // Estatísticas de contactos
            contactStats: contactStats,
            
            // Objeto stats completo
            stats: {
                totalEvents: totalEvents,
                totalNews: totalNews,
                publishedNews: publishedNews,
                totalUsers: totalUsers || 0,
                totalRegulations: totalRegulations || 0,
                totalEconomicRegulations: totalEconomicRegulations || 0,
                totalAccidents: totalAccidents || 0,
                totalCooperations: totalCooperations || 0,
                totalForms: totalForms,
                contactStats: contactStats
            },
            
            // Dados recentes
            recentNews: recentNews,
            recentContacts: recentContacts, // ✅ COM CAMPO MENSAGEM
            recentForms: recentForms,
            
            // Informações do usuário
            user: currentUser,
            currentPage: 'dashboard',
            messages: req.flash()
        });

    } catch (error) {
        console.error('❌ Erro ao carregar dashboard:', error);
        
        const currentUser = req.session.user || req.user;
        
        // Em caso de erro, fornecer valores padrão
        const defaultContactStats = {
            total: 0,
            novos: 0,
            naoLidos: 0,
            respondidos: 0,
            pendentes: 0
        };
        
        res.render('admin/dashboard', {
            title: 'Dashboard',
            newsCount: 0,
            eventsCount: 0,
            usersCount: 0,
            regulationsCount: 0,
            economicRegulationsCount: 0,
            accidentsCount: 0,
            cooperationsCount: 0,
            formsCount: 0,
            publishedNewsCount: 0,
            contactStats: defaultContactStats,
            stats: {
                totalEvents: 0,
                totalNews: 0,
                publishedNews: 0,
                totalUsers: 0,
                totalRegulations: 0,
                totalEconomicRegulations: 0,
                totalAccidents: 0,
                totalCooperations: 0,
                totalForms: 0,
                contactStats: defaultContactStats
            },
            recentNews: [],
            recentContacts: [], // Array vazio em caso de erro
            recentForms: [],
            user: currentUser,
            currentPage: 'dashboard',
            messages: req.flash()
        });
    }
};

// API para contador de não lidos
exports.getUnreadCount = async (req, res) => {
    try {
        const count = await Contact.count({ 
            where: { 
                [Op.or]: [
                    { isRead: false },
                    { status: 'novo' }
                ]
            } 
        });
        
        res.json({ 
            success: true, 
            count 
        });
    } catch (error) {
        console.error('❌ Erro ao contar não lidos:', error);
        res.status(500).json({ 
            success: false, 
            count: 0 
        });
    }
};

module.exports = exports;