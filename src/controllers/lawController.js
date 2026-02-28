// src/controllers/lawController.js
const { Law, User } = require('../models');

// Listar todas as leis e decretos
exports.list = async (req, res) => {
    try {
        const currentUser = req.session.user || req.user;
        
        if (!currentUser) {
            req.flash('error', 'Sessão expirada. Faça login novamente.');
            return res.redirect('/auth/login');
        }

        // Buscar todas as leis COM o autor
        const laws = await Law.findAll({
            order: [['ord', 'ASC']],
            include: [{
                model: User,
                as: 'author',
                attributes: ['id', 'name', 'email']
            }]
        });

        res.render('admin/laws/index', {
            title: 'Gestão de Leis e Decretos',
            laws: laws,
            user: currentUser,
            currentPage: 'laws',
            messages: {
                success: req.flash('success'),
                error: req.flash('error')
            }
        });

    } catch (error) {
        console.error('❌ Erro ao carregar leis e decretos:', error);
        req.flash('error', 'Erro ao carregar leis e decretos');
        res.redirect('/admin');
    }
};

// Formulário para criar nova lei/decreto
exports.createForm = async (req, res) => {
    try {
        const currentUser = req.session.user || req.user;
        
        if (!currentUser) {
            req.flash('error', 'Sessão expirada. Faça login novamente.');
            return res.redirect('/auth/login');
        }

        res.render('admin/laws/create', {
            title: 'Nova Lei/Decreto',
            user: currentUser,
            currentPage: 'laws',
            messages: {
                success: req.flash('success'),
                error: req.flash('error')
            }
        });

    } catch (error) {
        console.error('❌ Erro ao carregar formulário:', error);
        req.flash('error', 'Erro ao carregar formulário');
        res.redirect('/admin/laws');
    }
};

// Criar nova lei/decreto
exports.create = async (req, res) => {
    try {
        const currentUser = req.session.user || req.user;
        
        if (!currentUser) {
            req.flash('error', 'Sessão expirada. Faça login novamente.');
            return res.redirect('/auth/login');
        }

        const { 
            ord, 
            decreeNumber, 
            title, 
            publicationDate 
        } = req.body;

        // Verificar se foi enviado um arquivo
        let fileUrl = '';
        if (req.file) {
            fileUrl = `/uploads/laws/${req.file.filename}`;
        } else if (req.body.fileUrl) {
            fileUrl = req.body.fileUrl;
        }

        // Validar dados
        if (!ord || !decreeNumber || !title || !publicationDate || !fileUrl) {
            req.flash('error', 'Por favor, preencha todos os campos obrigatórios e selecione um arquivo');
            return res.redirect('/admin/laws/create');
        }

        // Criar lei/decreto
        const law = await Law.create({
            ord: ord,
            decreeNumber: decreeNumber,
            title: title,
            publicationDate: publicationDate,
            fileUrl: fileUrl,
            isPublished: req.body.isPublished === 'on',
            authorId: currentUser.id
        });

        req.flash('success', 'Lei/Decreto criado com sucesso!');
        res.redirect('/admin/laws');

    } catch (error) {
        console.error('❌ Erro ao criar lei/decreto:', error);
        req.flash('error', 'Erro ao criar lei/decreto: ' + error.message);
        res.redirect('/admin/laws/create');
    }
};

// Formulário para editar lei/decreto
exports.editForm = async (req, res) => {
    try {
        const currentUser = req.session.user || req.user;
        const { id } = req.params;
        
        if (!currentUser) {
            req.flash('error', 'Sessão expirada. Faça login novamente.');
            return res.redirect('/auth/login');
        }

        // Buscar lei/decreto
        const law = await Law.findByPk(id, {
            include: [{
                model: User,
                as: 'author',
                attributes: ['id', 'name', 'email']
            }]
        });
        
        if (!law) {
            req.flash('error', 'Lei/Decreto não encontrado');
            return res.redirect('/admin/laws');
        }

        res.render('admin/laws/edit', {
            title: 'Editar Lei/Decreto',
            law: law,
            user: currentUser,
            currentPage: 'laws',
            messages: {
                success: req.flash('success'),
                error: req.flash('error')
            }
        });

    } catch (error) {
        console.error('❌ Erro ao carregar formulário de edição:', error);
        req.flash('error', 'Erro ao carregar formulário de edição');
        res.redirect('/admin/laws');
    }
};

// Atualizar lei/decreto
exports.update = async (req, res) => {
    try {
        const currentUser = req.session.user || req.user;
        const { id } = req.params;
        
        if (!currentUser) {
            req.flash('error', 'Sessão expirada. Faça login novamente.');
            return res.redirect('/auth/login');
        }

        // Buscar lei/decreto
        const law = await Law.findByPk(id);
        
        if (!law) {
            req.flash('error', 'Lei/Decreto não encontrado');
            return res.redirect('/admin/laws');
        }

        const { 
            ord, 
            decreeNumber, 
            title, 
            publicationDate 
        } = req.body;

        // Verificar se foi enviado um novo arquivo
        let fileUrl = law.fileUrl;
        if (req.file) {
            fileUrl = `/uploads/laws/${req.file.filename}`;
        } else if (req.body.fileUrl && req.body.fileUrl !== law.fileUrl) {
            fileUrl = req.body.fileUrl;
        }

        // Validar dados
        if (!ord || !decreeNumber || !title || !publicationDate || !fileUrl) {
            req.flash('error', 'Por favor, preencha todos os campos obrigatórios');
            return res.redirect(`/admin/laws/${id}/edit`);
        }

        // Atualizar lei/decreto
        await law.update({
            ord: ord,
            decreeNumber: decreeNumber,
            title: title,
            publicationDate: publicationDate,
            fileUrl: fileUrl,
            isPublished: req.body.isPublished === 'on'
        });

        req.flash('success', 'Lei/Decreto atualizado com sucesso!');
        res.redirect('/admin/laws');

    } catch (error) {
        console.error('❌ Erro ao atualizar lei/decreto:', error);
        req.flash('error', 'Erro ao atualizar lei/decreto');
        res.redirect(`/admin/laws/${id}/edit`);
    }
};

// Excluir lei/decreto
exports.delete = async (req, res) => {
    try {
        const currentUser = req.session.user || req.user;
        const { id } = req.params;
        
        if (!currentUser) {
            req.flash('error', 'Sessão expirada. Faça login novamente.');
            return res.redirect('/auth/login');
        }

        // Buscar lei/decreto
        const law = await Law.findByPk(id);
        
        if (!law) {
            req.flash('error', 'Lei/Decreto não encontrado');
            return res.redirect('/admin/laws');
        }

        await law.destroy();
        
        req.flash('success', 'Lei/Decreto excluído com sucesso!');
        res.redirect('/admin/laws');

    } catch (error) {
        console.error('❌ Erro ao excluir lei/decreto:', error);
        req.flash('error', 'Erro ao excluir lei/decreto');
        res.redirect('/admin/laws');
    }
};

// Alternar status de publicação
exports.togglePublish = async (req, res) => {
    try {
        const currentUser = req.session.user || req.user;
        const { id } = req.params;
        
        if (!currentUser) {
            return res.status(401).json({ success: false, message: 'Não autorizado' });
        }

        // Buscar lei/decreto
        const law = await Law.findByPk(id);
        
        if (!law) {
            return res.status(404).json({ success: false, message: 'Lei/Decreto não encontrado' });
        }

        // Alternar status
        await law.update({
            isPublished: !law.isPublished
        });

        return res.json({ 
            success: true, 
            message: 'Status atualizado com sucesso',
            isPublished: law.isPublished
        });

    } catch (error) {
        console.error('❌ Erro ao alternar status:', error);
        return res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
};

// Visualizar detalhes da lei/decreto
exports.view = async (req, res) => {
    try {
        const currentUser = req.session.user || req.user;
        const { id } = req.params;
        
        if (!currentUser) {
            req.flash('error', 'Sessão expirada. Faça login novamente.');
            return res.redirect('/auth/login');
        }

        // Buscar lei/decreto com autor
        const law = await Law.findByPk(id, {
            include: [{
                model: User,
                as: 'author',
                attributes: ['id', 'name', 'email']
            }]
        });
        
        if (!law) {
            req.flash('error', 'Lei/Decreto não encontrado');
            return res.redirect('/admin/laws');
        }

        res.render('admin/laws/view', {
            title: 'Detalhes da Lei/Decreto',
            law: law,
            user: currentUser,
            currentPage: 'laws',
            messages: {
                success: req.flash('success'),
                error: req.flash('error')
            }
        });

    } catch (error) {
        console.error('❌ Erro ao carregar detalhes:', error);
        req.flash('error', 'Erro ao carregar detalhes da lei/decreto');
        res.redirect('/admin/laws');
    }
};

module.exports = exports;