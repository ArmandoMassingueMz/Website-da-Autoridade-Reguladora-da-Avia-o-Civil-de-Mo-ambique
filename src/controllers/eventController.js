// controllers/eventController.js
const Event = require('../models/Event');
const User = require('../models/User');
const { uploadToCloudinary, deleteFromCloudinary } = require('../utils/cloudinary');
const fs = require('fs').promises;

// =============================================
// FUNÇÕES ADMIN
// =============================================

// Listar todos os eventos (Admin)
exports.list = async (req, res) => {
    try {
        const events = await Event.findAll({
            include: [{
                model: User,
                as: 'author',
                attributes: ['id', 'name', 'email']
            }],
            order: [['startDate', 'DESC']]
        });

        res.render('admin/events/list', {
            title: 'Gerenciar Eventos',
            events,
            user: req.user,
            currentPage: 'events',
            messages: req.flash()
        });
    } catch (error) {
        console.error('❌ Erro ao listar eventos:', error);
        req.flash('error', 'Erro ao carregar eventos');
        res.redirect('/admin/dashboard');
    }
};

// Formulário de criação
exports.createForm = (req, res) => {
    console.log('✅ Acessando formulário de criação de evento');
    res.render('admin/events/create', {
        title: 'Publicar Evento',
        user: req.user,
        currentPage: 'events',
        messages: req.flash()
    });
};

// Criar evento
exports.create = async (req, res) => {
    try {
        console.log('📝 Dados recebidos:', req.body);
        console.log('📷 Arquivo recebido:', req.file);

        const { title, description, startDate, endDate, isPublished } = req.body;

        // Validações
        if (!title || !description || !startDate || !endDate) {
            throw new Error('Todos os campos obrigatórios devem ser preenchidos');
        }

        let featuredImage = null;

        // Upload da imagem se existir
        if (req.file) {
            console.log('📤 Fazendo upload da imagem...');
            const result = await uploadToCloudinary(req.file.path, 'events');
            featuredImage = result.secure_url;
            console.log('✅ Imagem enviada:', featuredImage);
            
            // Deletar arquivo temporário
            await fs.unlink(req.file.path);
        }

        // Criar evento
        const event = await Event.create({
            title,
            description,
            featuredImage,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            isPublished: isPublished === 'true' || isPublished === true,
            authorId: req.user.id
        });

        console.log('✅ Evento criado com sucesso:', event.id);
        req.flash('success', 'Evento criado com sucesso!');
        res.redirect('/admin/events');
    } catch (error) {
        console.error('❌ Erro ao criar evento:', error);
        
        // Deletar imagem se o upload foi feito mas houve erro
        if (req.file) {
            try {
                await fs.unlink(req.file.path);
            } catch (unlinkError) {
                console.error('❌ Erro ao deletar arquivo temporário:', unlinkError);
            }
        }
        
        req.flash('error', error.message || 'Erro ao criar evento');
        res.redirect('/admin/events/create');
    }
};

// Formulário de edição
exports.editForm = async (req, res) => {
    try {
        console.log('✏️ Carregando evento para edição, ID:', req.params.id);
        
        const event = await Event.findByPk(req.params.id);
        
        if (!event) {
            console.log('❌ Evento não encontrado, ID:', req.params.id);
            req.flash('error', 'Evento não encontrado');
            return res.redirect('/admin/events');
        }

        console.log('✅ Evento encontrado:', event.title);
        res.render('admin/events/edit', {
            title: 'Editar Evento',
            event,
            user: req.user,
            currentPage: 'events',
            messages: req.flash()
        });
    } catch (error) {
        console.error('❌ Erro ao carregar evento:', error);
        req.flash('error', 'Erro ao carregar evento');
        res.redirect('/admin/events');
    }
};

// Atualizar evento
exports.update = async (req, res) => {
    try {
        console.log('🔄 Atualizando evento, ID:', req.params.id);
        
        const event = await Event.findByPk(req.params.id);
        
        if (!event) {
            console.log('❌ Evento não encontrado para atualização, ID:', req.params.id);
            req.flash('error', 'Evento não encontrado');
            return res.redirect('/admin/events');
        }

        const { title, description, startDate, endDate, isPublished } = req.body;
        let featuredImage = event.featuredImage;

        // Upload de nova imagem se existir
        if (req.file) {
            console.log('📤 Fazendo upload de nova imagem...');
            
            // Deletar imagem antiga do Cloudinary
            if (event.featuredImage) {
                await deleteFromCloudinary(event.featuredImage);
            }
            
            const result = await uploadToCloudinary(req.file.path, 'events');
            featuredImage = result.secure_url;
            console.log('✅ Nova imagem enviada:', featuredImage);
            
            // Deletar arquivo temporário
            await fs.unlink(req.file.path);
        }

        await event.update({
            title,
            description,
            featuredImage,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            isPublished: isPublished === 'true' || isPublished === true
        });

        console.log('✅ Evento atualizado com sucesso');
        req.flash('success', 'Evento atualizado com sucesso!');
        res.redirect('/admin/events');
    } catch (error) {
        console.error('❌ Erro ao atualizar evento:', error);
        
        if (req.file) {
            try {
                await fs.unlink(req.file.path);
            } catch (unlinkError) {
                console.error('❌ Erro ao deletar arquivo temporário:', unlinkError);
            }
        }
        
        req.flash('error', error.message || 'Erro ao atualizar evento');
        res.redirect(`/admin/events/${req.params.id}/edit`);
    }
};

// Deletar evento
exports.delete = async (req, res) => {
    try {
        console.log('🗑️ Deletando evento, ID:', req.params.id);
        
        const event = await Event.findByPk(req.params.id);
        
        if (!event) {
            console.log('❌ Evento não encontrado para deletar, ID:', req.params.id);
            req.flash('error', 'Evento não encontrado');
            return res.redirect('/admin/events');
        }

        // Deletar imagem do Cloudinary
        if (event.featuredImage) {
            await deleteFromCloudinary(event.featuredImage);
        }

        await event.destroy();

        console.log('✅ Evento deletado com sucesso');
        req.flash('success', 'Evento deletado com sucesso!');
        res.redirect('/admin/events');
    } catch (error) {
        console.error('❌ Erro ao deletar evento:', error);
        req.flash('error', 'Erro ao deletar evento');
        res.redirect('/admin/events');
    }
};

// =============================================
// FUNÇÕES PÚBLICAS
// =============================================

// Página pública de eventos - VERSÃO CORRIGIDA
exports.publicList = async (req, res) => {
    try {
        // NÃO desativamos eventos expirados automaticamente
        // await Event.deactivateExpiredEvents();

        const events = await Event.findAll({
            where: {
                isPublished: true
                // REMOVIDO: isActive: true - para mostrar TODOS os eventos publicados
            },
            include: [{
                model: User,
                as: 'author',
                attributes: ['name']
            }],
            order: [['startDate', 'DESC']] // Mostra os mais recentes primeiro
        });

        res.render('events/list', {
            title: 'Eventos',
            events,
            user: req.user,
            currentPage: 'eventos',
            messages: req.flash()
        });
    } catch (error) {
        console.error('❌ Erro ao carregar eventos públicos:', error);
        req.flash('error', 'Erro ao carregar eventos');
        res.redirect('/');
    }
};

// Detalhes de um evento - VERSÃO CORRIGIDA
exports.show = async (req, res) => {
    try {
        console.log('👁️ Visualizando evento público, ID:', req.params.id);
        
        const event = await Event.findOne({
            where: {
                id: req.params.id,
                isPublished: true
                // REMOVIDO: isActive: true - para mostrar TODOS os eventos publicados
            },
            include: [{
                model: User,
                as: 'author',
                attributes: ['name']
            }]
        });

        if (!event) {
            console.log('❌ Evento público não encontrado, ID:', req.params.id);
            req.flash('error', 'Evento não encontrado');
            return res.redirect('/eventos');
        }

        console.log('✅ Evento público encontrado:', event.title);
        res.render('events/show', {
            title: event.title,
            event,
            user: req.user,
            currentPage: 'eventos',
            messages: req.flash()
        });
    } catch (error) {
        console.error('❌ Erro ao carregar evento público:', error);
        req.flash('error', 'Erro ao carregar evento');
        res.redirect('/eventos');
    }
};

module.exports = exports;