// src/controllers/contactPublicController.js
const { Contact } = require('../models/Contact');

exports.submitContact = async (req, res) => {
    try {
        console.log('📩 Recebendo dados do formulário de contacto:', req.body);
        
        const { nome, email, telefone, assunto, mensagem, newsletter } = req.body;

        // Validação
        if (!nome || !email || !assunto || !mensagem) {
            return res.status(400).json({
                success: false,
                message: 'Por favor, preencha todos os campos obrigatórios'
            });
        }

        // Salvar no banco de dados
        const newContact = await Contact.create({
            nome,
            email,
            telefone: telefone || null,
            assunto,
            mensagem,
            newsletter: newsletter ? true : false,
            status: 'novo',
            isRead: false,
            isReplied: false,
            ipAddress: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress,
            userAgent: req.get('User-Agent') || 'Unknown'
        });

        console.log(`✅ Contacto salvo com ID: ${newContact.id}`);
        
        res.json({
            success: true,
            message: 'Mensagem enviada com sucesso! Entraremos em contacto em breve.'
        });

    } catch (error) {
        console.error('❌ Erro ao processar contacto:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao enviar mensagem. Por favor, tente novamente.'
        });
    }
};