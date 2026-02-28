// src/controllers/homeController.js
// COPIE ESTE ARQUIVO COMPLETO E SUBSTITUA O ANTIGO

const { News, Event, User } = require('../models');
const { Op } = require('sequelize');

exports.index = async (req, res) => {
    try {
        console.log('\n========================================');
        console.log('=== CONTROLLER HOME - INÍCIO ===');
        console.log('========================================\n');
        
        // Buscar notícias publicadas
        const featuredNews = await News.findAll({
            where: {
                isPublished: true
                // Se tiver campo isFeatured, adicione: isFeatured: true
            },
            include: [{
                model: User,
                as: 'author',
                attributes: ['id', 'name', 'email']
            }],
            order: [['createdAt', 'DESC']],
            limit: 5,
            raw: false
        });

        console.log(`✅ Notícias encontradas: ${featuredNews.length}`);

        // Buscar eventos publicados e ativos
        const featuredEvents = await Event.findAll({
            where: {
                isPublished: true,
                isActive: true
            },
            include: [{
                model: User,
                as: 'author',
                attributes: ['id', 'name', 'email']
            }],
            order: [['startDate', 'ASC']],
            limit: 5,
            raw: false
        });

        console.log(`✅ Eventos encontrados: ${featuredEvents.length}`);

        // Converter para objetos simples
        const newsArray = featuredNews.map(news => {
            const n = news.get({ plain: true });
            return {
                type: 'news',
                id: n.id,
                title: n.title,
                slug: n.slug,
                excerpt: n.excerpt,
                content: n.content,
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

        console.log(`✅ News array processado: ${newsArray.length} itens`);
        console.log(`✅ Events array processado: ${eventsArray.length} itens`);

        // INTERCALAR notícias e eventos
        const allItems = [];
        const maxLength = Math.max(newsArray.length, eventsArray.length);
        
        console.log('\n📋 Intercalando itens...');
        for (let i = 0; i < maxLength; i++) {
            if (i < newsArray.length) {
                allItems.push(newsArray[i]);
                console.log(`   ${allItems.length - 1}. NOTÍCIA: ${newsArray[i].title}`);
            }
            if (i < eventsArray.length) {
                allItems.push(eventsArray[i]);
                console.log(`   ${allItems.length - 1}. EVENTO: ${eventsArray[i].title}`);
            }
        }
        
        console.log(`\n✅ Total de items intercalados: ${allItems.length}`);
        console.log('\n========================================');
        console.log('=== ENVIANDO PARA A VIEW ===');
        console.log('========================================\n');

        // IMPORTANTE: Enviar allItems para a view
        res.render('pages/home', {
            title: 'Início - IACM',
            featuredNews: newsArray,
            featuredEvents: eventsArray,
            allItems: allItems,  // ← ESTE É O IMPORTANTE!
            user: req.session.user || null
        });

    } catch (error) {
        console.error('\n❌❌❌ ERRO NO CONTROLLER HOME ❌❌❌');
        console.error('Mensagem:', error.message);
        console.error('Stack:', error.stack);
        console.error('❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌\n');
        
        res.status(500).render('errors/500', {
            title: 'Erro - IACM',
            message: 'Erro ao carregar a página inicial'
        });
    }
};