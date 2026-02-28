const express = require('express');
const { requireAuth, requireRole } = require('../middleware/auth');
const EconomicRegulation = require('../models/EconomicRegulation');
const uploadPDF = require('../config/uploadPDF');
const router = express.Router();

// Lista de tipos de documentos de regulação econômica
const economicRegulationTypes = [
    'Empresas',
    'Acordos Aéreos',
    'Proteção Ambiental',
    'Estatística',
    'Defesa do Passageiro',
    'SIAV'
];

// Tipos de acordos para Acordos Aéreos
const agreementTypes = [
    'Acordo de Transporte Aéreo',
    'Acordo Aéreo',
    'Memorando de Entendimento',
    'Outro'
];

// Listar todos os documentos (admin) - ✅ CORRIGIDO
router.get('/', requireAuth, async (req, res) => {
    try {
        const economicRegulations = await EconomicRegulation.findAll({
            order: [['publicationDate', 'DESC']],
            attributes: { 
                exclude: ['createdBy']  // ✅ EXCLUI O CAMPO QUE NÃO EXISTE
            }
        });
        res.render('admin/economic-regulations/index', {
            title: 'Gestão de Regulação Econômica',
            economicRegulations,
            currentPage: 'economic-regulations',
            economicRegulationTypes,
            agreementTypes
        });
    } catch (error) {
        console.error('Erro ao carregar documentos de regulação econômica:', error);
        req.flash('error', 'Erro ao carregar documentos');
        res.redirect('/admin/dashboard');
    }
});

// Formulário para criar documento
router.get('/create', requireAuth, (req, res) => {
    res.render('admin/economic-regulations/create', {
        title: 'Adicionar Documento - Regulação Econômica',
        currentPage: 'economic-regulations',
        economicRegulationTypes,
        agreementTypes
    });
});

// Processar criação de documento (aceita múltiplos arquivos)
router.post('/', requireAuth, uploadPDF.fields([
    { name: 'file', maxCount: 1 },
    { name: 'image', maxCount: 1 }
]), async (req, res) => {
    try {
        console.log('📝 DEBUG - Iniciando criação de documento');
        console.log('📝 DEBUG - req.session.user:', req.session.user);
        console.log('📝 DEBUG - req.user:', req.user);
        
        const { 
            documentNumber, 
            title, 
            publicationDate, 
            type,
            year,
            period,
            agreementType,
            description
        } = req.body;

        // Validação básica
        if (!documentNumber || !title || !publicationDate || !type) {
            req.flash('error', 'Todos os campos obrigatórios devem ser preenchidos');
            return res.redirect('/admin/economic-regulations/create');
        }

        if (!req.files || !req.files.file) {
            req.flash('error', 'É necessário enviar um ficheiro');
            return res.redirect('/admin/economic-regulations/create');
        }

        const fileUrl = '/uploads/economic-regulations/' + req.files.file[0].filename;
        let imageUrl = null;

        // Se foi enviada uma imagem (para Proteção Ambiental)
        if (req.files.image) {
            imageUrl = '/uploads/economic-regulations/' + req.files.image[0].filename;
        }

        // ✅ CORREÇÃO: Usar req.session.user.id em vez de req.user.id
        // O usuário está em req.session.user, não em req.user
        const authorId = req.session.user ? req.session.user.id : null;
        
        if (!authorId) {
            console.error('❌ ERRO: Usuário não autenticado. req.session.user:', req.session.user);
            req.flash('error', 'Usuário não autenticado. Por favor, faça login novamente.');
            return res.redirect('/admin/economic-regulations/create');
        }

        console.log('📝 DEBUG - Criando documento com authorId:', authorId);

        await EconomicRegulation.create({
            documentNumber,
            title,
            publicationDate,
            type,
            fileUrl,
            year: year || null,
            period: period || null,
            agreementType: agreementType || null,
            description: description || null,
            imageUrl,
            authorId: authorId // ✅ AGORA USA authorId CORRETAMENTE
        });

        req.flash('success', 'Documento adicionado com sucesso!');
        res.redirect('/admin/economic-regulations');
    } catch (error) {
        console.error('Erro ao criar documento:', error);
        if (error.name === 'SequelizeUniqueConstraintError') {
            req.flash('error', 'Já existe um documento com este número');
        } else {
            req.flash('error', 'Erro ao criar documento: ' + error.message);
        }
        res.redirect('/admin/economic-regulations/create');
    }
});

// Formulário para editar documento - ✅ CORRIGIDO
router.get('/:id/edit', requireAuth, async (req, res) => {
    try {
        const economicRegulation = await EconomicRegulation.findByPk(req.params.id, {
            attributes: { exclude: ['createdBy'] } // ✅ EXCLUI O CAMPO PROBLEMÁTICO
        });
        if (!economicRegulation) {
            req.flash('error', 'Documento não encontrado');
            return res.redirect('/admin/economic-regulations');
        }
        res.render('admin/economic-regulations/edit', {
            title: 'Editar Documento - Regulação Econômica',
            economicRegulation,
            currentPage: 'economic-regulations',
            economicRegulationTypes,
            agreementTypes
        });
    } catch (error) {
        console.error('Erro ao carregar documento para edição:', error);
        req.flash('error', 'Erro ao carregar documento');
        res.redirect('/admin/economic-regulations');
    }
});

// Processar edição de documento - ✅ CORRIGIDO
router.post('/:id', requireAuth, uploadPDF.fields([
    { name: 'file', maxCount: 1 },
    { name: 'image', maxCount: 1 }
]), async (req, res) => {
    try {
        const { 
            documentNumber, 
            title, 
            publicationDate, 
            type,
            year,
            period,
            agreementType,
            description,
            isActive
        } = req.body;
        
        const economicRegulation = await EconomicRegulation.findByPk(req.params.id, {
            attributes: { exclude: ['createdBy'] } // ✅ EXCLUI O CAMPO PROBLEMÁTICO
        });

        if (!economicRegulation) {
            req.flash('error', 'Documento não encontrado');
            return res.redirect('/admin/economic-regulations');
        }

        const updateData = {
            documentNumber,
            title,
            publicationDate,
            type,
            year: year || null,
            period: period || null,
            agreementType: agreementType || null,
            description: description || null,
            isActive: isActive === 'on'
        };

        // Se foi enviado um novo ficheiro principal
        if (req.files && req.files.file) {
            updateData.fileUrl = '/uploads/economic-regulations/' + req.files.file[0].filename;
        }

        // Se foi enviada uma nova imagem
        if (req.files && req.files.image) {
            updateData.imageUrl = '/uploads/economic-regulations/' + req.files.image[0].filename;
        }

        await economicRegulation.update(updateData);

        req.flash('success', 'Documento atualizado com sucesso!');
        res.redirect('/admin/economic-regulations');
    } catch (error) {
        console.error('Erro ao atualizar documento:', error);
        if (error.name === 'SequelizeUniqueConstraintError') {
            req.flash('error', 'Já existe um documento com este número');
        } else {
            req.flash('error', 'Erro ao atualizar documento');
        }
        res.redirect(`/admin/economic-regulations/${req.params.id}/edit`);
    }
});

// Alternar status ativo/inativo (AJAX)
router.post('/:id/toggle', requireAuth, async (req, res) => {
    try {
        const economicRegulation = await EconomicRegulation.findByPk(req.params.id);
        
        if (!economicRegulation) {
            return res.status(404).json({ success: false, message: 'Documento não encontrado' });
        }

        await economicRegulation.update({ isActive: !economicRegulation.isActive });
        
        res.json({ 
            success: true, 
            message: `Documento ${economicRegulation.isActive ? 'ativado' : 'desativado'} com sucesso!`,
            isActive: economicRegulation.isActive
        });
    } catch (error) {
        console.error('Erro ao alternar status:', error);
        res.status(500).json({ success: false, message: 'Erro ao alternar status' });
    }
});

// Excluir documento - ✅ CORRIGIDO
router.post('/:id/delete', requireAuth, async (req, res) => {
    try {
        const economicRegulation = await EconomicRegulation.findByPk(req.params.id, {
            attributes: { exclude: ['createdBy'] } // ✅ EXCLUI O CAMPO PROBLEMÁTICO
        });
        if (!economicRegulation) {
            req.flash('error', 'Documento não encontrado');
            return res.redirect('/admin/economic-regulations');
        }
        await economicRegulation.destroy();
        req.flash('success', 'Documento excluído com sucesso!');
        res.redirect('/admin/economic-regulations');
    } catch (error) {
        console.error('Erro ao excluir documento:', error);
        req.flash('error', 'Erro ao excluir documento');
        res.redirect('/admin/economic-regulations');
    }
});

module.exports = router;