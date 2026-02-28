// src/routes/laws.js
const express = require('express');
const router = express.Router();
const { requireAuth, requireRole } = require('../middleware/auth');
const { Law } = require('../models');
const path = require('path');
const fs = require('fs').promises;
const { uploadLaws } = require('../config/upload');

// =============================================
// LISTAR TODAS AS LEIS
// =============================================
router.get('/', requireAuth, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const laws = await Law.findAll({
      order: [['ord', 'ASC']]
    });

    res.render('admin/laws/index', {
      title: 'Gestão de Leis e Decretos',
      currentPage: 'laws',
      laws,
      messages: {
        success: req.flash('success'),
        error: req.flash('error')
      }
    });
  } catch (error) {
    console.error('❌ Erro ao listar leis:', error);
    req.flash('error', 'Erro ao carregar leis e decretos');
    res.redirect('/admin/dashboard');
  }
});

// =============================================
// FORMULÁRIO PARA CRIAR LEI
// =============================================
router.get('/create', requireAuth, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    // Buscar o próximo número de ordem
    const lastLaw = await Law.findOne({
      order: [['ord', 'DESC']]
    });

    let nextOrd = '01';
    if (lastLaw) {
      const lastOrdNumber = parseInt(lastLaw.ord);
      nextOrd = String(lastOrdNumber + 1).padStart(2, '0');
    }

    res.render('admin/laws/create', {
      title: 'Criar Lei/Decreto',
      currentPage: 'laws',
      nextOrd,
      messages: {
        success: req.flash('success'),
        error: req.flash('error')
      }
    });
  } catch (error) {
    console.error('❌ Erro ao abrir formulário:', error);
    req.flash('error', 'Erro ao abrir formulário');
    res.redirect('/admin/laws');
  }
});

// =============================================
// PROCESSAR CRIAÇÃO DE LEI
// =============================================
router.post('/', requireAuth, requireRole(['admin', 'super_admin']), uploadLaws.single('document'), async (req, res) => {
  try {
    const { ord, decreeNumber, title, publicationDate, isPublished } = req.body;

    console.log('📝 Dados recebidos:', req.body);
    console.log('📄 Arquivo recebido:', req.file);

    // Validação básica
    if (!ord || !decreeNumber || !title) {
      req.flash('error', 'Preencha todos os campos obrigatórios');
      return res.redirect('/admin/laws/create');
    }

    if (!req.file) {
      req.flash('error', 'Por favor, selecione um arquivo');
      return res.redirect('/admin/laws/create');
    }

    // Verificar se o número de ordem já existe
    const existingLaw = await Law.findOne({ where: { ord: ord.padStart(2, '0') } });
    if (existingLaw) {
      req.flash('error', 'Já existe uma lei com este número de ordem');
      return res.redirect('/admin/laws/create');
    }

    // Processar o arquivo enviado
    const fileUrl = '/uploads/laws/' + req.file.filename;
    
    console.log('✅ Arquivo salvo em:', fileUrl);
    console.log('✅ Caminho físico:', req.file.path);

    // Criar a lei
    const newLaw = await Law.create({
      ord: ord.padStart(2, '0'),
      decreeNumber: decreeNumber.trim(),
      title: title.trim(),
      fileUrl,
      publicationDate: publicationDate || null,
      isPublished: isPublished === 'on',
      authorId: req.session.user.id
    });

    console.log('✅ Lei/Decreto criado com ID:', newLaw.id);
    req.flash('success', 'Lei/Decreto criado com sucesso!');
    res.redirect('/admin/laws');
  } catch (error) {
    console.error('❌ Erro ao criar lei:', error);
    
    // Tratamento específico de erros do multer
    if (error.code === 'LIMIT_FILE_SIZE') {
      req.flash('error', 'Arquivo muito grande. Tamanho máximo: 20MB');
    } else if (error.message && error.message.includes('apenas arquivos')) {
      req.flash('error', 'Tipo de arquivo não permitido. Use PDF, DOC ou DOCX');
    } else {
      req.flash('error', 'Erro ao criar lei/decreto: ' + (error.message || 'Erro desconhecido'));
    }
    
    res.redirect('/admin/laws/create');
  }
});

// =============================================
// FORMULÁRIO PARA EDITAR LEI
// =============================================
router.get('/:id/edit', requireAuth, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const law = await Law.findByPk(req.params.id);

    if (!law) {
      req.flash('error', 'Lei/Decreto não encontrado');
      return res.redirect('/admin/laws');
    }

    res.render('admin/laws/edit', {
      title: 'Editar Lei/Decreto',
      currentPage: 'laws',
      law,
      messages: {
        success: req.flash('success'),
        error: req.flash('error')
      }
    });
  } catch (error) {
    console.error('❌ Erro ao carregar lei:', error);
    req.flash('error', 'Erro ao carregar lei/decreto');
    res.redirect('/admin/laws');
  }
});

// =============================================
// PROCESSAR EDIÇÃO DE LEI
// =============================================
router.post('/:id', requireAuth, requireRole(['admin', 'super_admin']), uploadLaws.single('document'), async (req, res) => {
  try {
    const { ord, decreeNumber, title, publicationDate, isPublished, currentFile } = req.body;
    const law = await Law.findByPk(req.params.id);

    if (!law) {
      req.flash('error', 'Lei/Decreto não encontrado');
      return res.redirect('/admin/laws');
    }

    // Verificar se o número de ordem já existe (exceto o atual)
    if (ord !== law.ord) {
      const existingLaw = await Law.findOne({ 
        where: { ord: ord.padStart(2, '0') }
      });
      
      if (existingLaw && existingLaw.id !== law.id) {
        req.flash('error', 'Já existe uma lei com este número de ordem');
        return res.redirect(`/admin/laws/${law.id}/edit`);
      }
    }

    let updateData = {
      ord: ord.padStart(2, '0'),
      decreeNumber: decreeNumber.trim(),
      title: title.trim(),
      publicationDate: publicationDate || null,
      isPublished: isPublished === 'on'
    };

    // Processar novo arquivo se enviado
    if (req.file) {
      // Atualizar URL do arquivo
      updateData.fileUrl = '/uploads/laws/' + req.file.filename;
      
      // Tentar remover arquivo antigo se existir e for diferente
      if (law.fileUrl && law.fileUrl !== currentFile) {
        const oldFilePath = path.join(__dirname, '..', 'public', law.fileUrl);
        try {
          await fs.unlink(oldFilePath);
          console.log('🗑️ Arquivo antigo deletado:', oldFilePath);
        } catch (err) {
          console.log('⚠️ Não foi possível deletar o arquivo antigo:', err.message);
        }
      }
    } else if (currentFile) {
      // Manter o arquivo atual
      updateData.fileUrl = currentFile;
    } else {
      // Se não há arquivo atual e não enviou novo, manter o existente
      updateData.fileUrl = law.fileUrl;
    }

    await law.update(updateData);

    req.flash('success', 'Lei/Decreto atualizado com sucesso!');
    res.redirect('/admin/laws');
  } catch (error) {
    console.error('❌ Erro ao atualizar lei:', error);
    
    if (error.code === 'LIMIT_FILE_SIZE') {
      req.flash('error', 'Arquivo muito grande. Tamanho máximo: 20MB');
    } else if (error.message && error.message.includes('apenas arquivos')) {
      req.flash('error', 'Tipo de arquivo não permitido. Use PDF, DOC ou DOCX');
    } else {
      req.flash('error', 'Erro ao atualizar lei/decreto: ' + (error.message || 'Erro desconhecido'));
    }
    
    res.redirect(`/admin/laws/${req.params.id}/edit`);
  }
});

// =============================================
// EXCLUIR LEI
// =============================================
router.post('/:id/delete', requireAuth, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const law = await Law.findByPk(req.params.id);

    if (!law) {
      req.flash('error', 'Lei/Decreto não encontrado');
      return res.redirect('/admin/laws');
    }

    // Deletar arquivo físico se existir
    if (law.fileUrl) {
      const filePath = path.join(__dirname, '..', 'public', law.fileUrl);
      try {
        await fs.unlink(filePath);
        console.log('🗑️ Arquivo deletado:', filePath);
      } catch (err) {
        console.log('⚠️ Arquivo não encontrado para deletar:', filePath);
      }
    }

    await law.destroy();

    req.flash('success', 'Lei/Decreto excluído com sucesso!');
    res.redirect('/admin/laws');
  } catch (error) {
    console.error('❌ Erro ao excluir lei:', error);
    req.flash('error', 'Erro ao excluir lei/decreto: ' + error.message);
    res.redirect('/admin/laws');
  }
});

// =============================================
// ROTA PARA VISUALIZAR/DOWNLOAD DE LEI
// =============================================
router.get('/download/:id', async (req, res) => {
  try {
    const law = await Law.findByPk(req.params.id);
    
    if (!law) {
      return res.status(404).send('Lei não encontrada');
    }
    
    if (!law.fileUrl) {
      return res.status(404).send('Arquivo não encontrado');
    }
    
    const filePath = path.join(__dirname, '..', 'public', law.fileUrl);
    
    // Verificar se o arquivo existe
    try {
      await fs.access(filePath);
    } catch (err) {
      console.error('Arquivo não encontrado:', filePath);
      return res.status(404).send('Arquivo não encontrado no servidor');
    }
    
    // Enviar arquivo
    res.download(filePath);
  } catch (error) {
    console.error('❌ Erro ao baixar lei:', error);
    res.status(500).send('Erro ao baixar arquivo');
  }
});

module.exports = router;