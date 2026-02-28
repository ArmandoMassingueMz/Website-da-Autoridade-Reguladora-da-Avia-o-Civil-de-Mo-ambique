// controllers/newsController.js
// ✅ VERSÃO CORRIGIDA - COMPATÍVEL COM SEU upload.js
const News = require('../models/News');
const User = require('../models/User');
const path = require('path');
const fs = require('fs');

// =============================================
// LISTAR NOTÍCIAS (FRONTEND)
// =============================================
exports.listNews = async (req, res) => {
  try {
    const news = await News.findAll({
      where: { isPublished: true },
      include: [{
        model: User,
        as: 'author',
        attributes: ['name']
      }],
      order: [['createdAt', 'DESC']],
      limit: 50
    });

    res.render('news/index', { news });
  } catch (error) {
    console.error('Erro ao listar notícias:', error);
    res.render('news/index', { news: [] });
  }
};

// =============================================
// ADMIN - LISTAR NOTÍCIAS
// =============================================
exports.adminListNews = async (req, res) => {
  try {
    const news = await News.findAll({
      include: [{
        model: User,
        as: 'author',
        attributes: ['name']
      }],
      order: [['createdAt', 'DESC']]
    });

    res.render('admin/news/list', { news });
  } catch (error) {
    console.error('Erro ao listar notícias (admin):', error);
    req.flash('error', 'Erro ao carregar notícias');
    res.redirect('/admin/dashboard');
  }
};

// =============================================
// ADMIN - MOSTRAR FORM DE CRIAR NOTÍCIA
// =============================================
exports.adminCreateNewsForm = (req, res) => {
  res.render('admin/news/create');
};

// =============================================
// ADMIN - CRIAR NOTÍCIA (COM UPLOAD DE IMAGEM)
// =============================================
exports.adminCreateNews = async (req, res) => {
  try {
    console.log('\n╔════════════════════════════════════════╗');
    console.log('║   CRIAR NOTÍCIA - DEBUG COMPLETO      ║');
    console.log('╚════════════════════════════════════════╝\n');
    
    // 1. VERIFICAR BODY
    console.log('📝 BODY RECEBIDO:');
    console.log('   ✓ Title:', req.body.title || '❌ VAZIO');
    console.log('   ✓ Excerpt:', req.body.excerpt ? 'Presente' : '❌ VAZIO');
    console.log('   ✓ Content:', req.body.content ? 'Presente' : '❌ VAZIO');
    console.log('   ✓ isPublished:', req.body.isPublished || 'false');
    
    // 2. VERIFICAR ARQUIVO - CRÍTICO
    console.log('\n📎 VERIFICAÇÃO DO ARQUIVO:');
    console.log('─'.repeat(50));
    
    if (req.file) {
      console.log('✅✅✅ ARQUIVO DETECTADO PELO MULTER! ✅✅✅\n');
      console.log('   📄 Nome original:', req.file.originalname);
      console.log('   📄 Nome salvo:', req.file.filename);
      console.log('   📁 Destino:', req.file.destination);
      console.log('   📂 Path completo:', req.file.path);
      console.log('   📊 Tamanho:', `${(req.file.size / 1024).toFixed(2)} KB`);
      console.log('   🎨 Tipo MIME:', req.file.mimetype);
      console.log('   🏷️  Field name:', req.file.fieldname);
      
      // Verificar se arquivo existe fisicamente
      if (fs.existsSync(req.file.path)) {
        console.log('\n   ✅ CONFIRMADO: Arquivo existe no disco!');
      } else {
        console.log('\n   ❌ ERRO: Arquivo NÃO encontrado no disco!');
      }
    } else {
      console.log('❌❌❌ NENHUM ARQUIVO RECEBIDO! ❌❌❌\n');
      console.log('🔍 POSSÍVEIS CAUSAS:\n');
      console.log('   1. Formulário sem enctype="multipart/form-data"');
      console.log('   2. Input sem name="featuredImage"');
      console.log('   3. Rota sem middleware upload.single("featuredImage")');
      console.log('   4. Usuário não selecionou arquivo');
      console.log('   5. Arquivo muito grande (>50MB)');
      console.log('   6. Tipo de arquivo não permitido (não é imagem)');
      console.log('\n   👉 Verifique o console do navegador (F12) para erros!');
    }
    console.log('─'.repeat(50));

    const { title, excerpt, content, isPublished } = req.body;

    // 3. VALIDAR CAMPOS OBRIGATÓRIOS
    if (!title || !excerpt || !content) {
      console.log('\n❌ VALIDAÇÃO FALHOU - Campos obrigatórios vazios:');
      console.log(`   • Título: ${title ? '✓' : '✗ FALTANDO'}`);
      console.log(`   • Resumo: ${excerpt ? '✓' : '✗ FALTANDO'}`);
      console.log(`   • Conteúdo: ${content ? '✓' : '✗ FALTANDO'}`);
      
      req.flash('error', 'Título, resumo e conteúdo são obrigatórios');
      return res.redirect('/admin/news/create');
    }

    // 4. GERAR SLUG
    const baseSlug = title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
    
    const slug = `${baseSlug}-${Date.now()}`;

    // 5. PROCESSAR IMAGEM
    let featuredImage = '/images/news-default.jpg'; // Imagem padrão
    
    if (req.file) {
      // ✅ CAMINHO RELATIVO PARA O BANCO DE DADOS
      // Seu upload.js salva em: src/config/../public/uploads/news/news-123456.jpg
      // Que se resolve para: src/public/uploads/news/news-123456.jpg
      // No banco salvamos: /uploads/news/news-123456.jpg
      featuredImage = `/uploads/news/${req.file.filename}`;
      
      console.log('\n✅ IMAGEM PROCESSADA:');
      console.log('   📂 Path físico:', req.file.path);
      console.log('   🔗 Path para BD:', featuredImage);
      console.log('   📊 Tamanho:', `${(req.file.size / 1024).toFixed(2)} KB`);
    } else {
      console.log('\n⚠️  Usando imagem padrão (nenhuma imagem enviada)');
    }

    // 6. PREPARAR DADOS
    const newsData = {
      title,
      slug,
      excerpt,
      content,
      featuredImage, // ✅ Aqui está o campo crítico
      isPublished: isPublished === 'on' || isPublished === true || isPublished === 'true',
      publishedAt: (isPublished === 'on' || isPublished === true || isPublished === 'true') ? new Date() : null,
      authorId: req.user.id
    };

    console.log('\n💾 DADOS PARA O BANCO:');
    console.log(JSON.stringify(newsData, null, 2));

    // 7. SALVAR NO BANCO
    const news = await News.create(newsData);

    console.log('\n╔════════════════════════════════════════╗');
    console.log('║      ✅ NOTÍCIA CRIADA COM SUCESSO!   ║');
    console.log('╚════════════════════════════════════════╝');
    console.log('\n📋 Detalhes:');
    console.log('   🆔 ID:', news.id);
    console.log('   📰 Título:', news.title);
    console.log('   🖼️  Imagem salva no BD:', news.featuredImage);
    console.log('   📅 Publicada:', news.isPublished ? 'Sim' : 'Não');
    console.log('');

    req.flash('success', 'Notícia criada com sucesso!');
    res.redirect('/admin/news');

  } catch (error) {
    console.log('\n╔════════════════════════════════════════╗');
    console.log('║        ❌ ERRO AO CRIAR NOTÍCIA       ║');
    console.log('╚════════════════════════════════════════╝');
    console.error('\n📛 Erro:', error.message);
    console.error('📋 Stack:', error.stack);
    console.log('');
    
    req.flash('error', 'Erro ao criar notícia: ' + error.message);
    res.redirect('/admin/news/create');
  }
};

// =============================================
// ADMIN - MOSTRAR FORM DE EDITAR NOTÍCIA
// =============================================
exports.adminEditNewsForm = async (req, res) => {
  try {
    const { id } = req.params;
    const news = await News.findByPk(id);

    if (!news) {
      req.flash('error', 'Notícia não encontrada');
      return res.redirect('/admin/news');
    }

    res.render('admin/news/edit', { news });
  } catch (error) {
    console.error('Erro ao carregar notícia para edição:', error);
    req.flash('error', 'Erro ao carregar notícia');
    res.redirect('/admin/news');
  }
};

// =============================================
// ADMIN - ATUALIZAR NOTÍCIA (COM UPLOAD DE IMAGEM)
// =============================================
exports.adminUpdateNews = async (req, res) => {
  try {
    console.log('\n╔════════════════════════════════════════╗');
    console.log('║   ATUALIZAR NOTÍCIA - DEBUG           ║');
    console.log('╚════════════════════════════════════════╝\n');
    
    const { id } = req.params;
    const { title, excerpt, content, isPublished } = req.body;

    console.log('📝 ID da notícia:', id);
    console.log('📎 Novo arquivo:', req.file ? 'SIM' : 'NÃO');

    const news = await News.findByPk(id);
    if (!news) {
      req.flash('error', 'Notícia não encontrada');
      return res.redirect('/admin/news');
    }

    console.log('📰 Notícia atual:');
    console.log('   Título:', news.title);
    console.log('   Imagem atual:', news.featuredImage);

    // Atualizar campos de texto
    news.title = title;
    news.excerpt = excerpt;
    news.content = content;
    news.isPublished = isPublished === 'on' || isPublished === true || isPublished === 'true';

    if (news.isPublished && !news.publishedAt) {
      news.publishedAt = new Date();
    }

    // Processar nova imagem (se houver)
    if (req.file) {
      console.log('\n✅ Nova imagem recebida:', req.file.filename);
      
      // Deletar imagem antiga (se não for a padrão)
      if (news.featuredImage && 
          news.featuredImage !== '/images/news-default.jpg' &&
          !news.featuredImage.includes('news-default')) {
        
        // Construir path completo: src/public/uploads/news/arquivo.jpg
        const oldImagePath = path.join(__dirname, '..', 'public', news.featuredImage);
        
        console.log('🗑️  Tentando deletar imagem antiga:', oldImagePath);
        
        if (fs.existsSync(oldImagePath)) {
          try {
            fs.unlinkSync(oldImagePath);
            console.log('   ✅ Imagem antiga deletada!');
          } catch (err) {
            console.log('   ⚠️  Erro ao deletar:', err.message);
          }
        }
      }
      
      // Salvar nova imagem
      news.featuredImage = `/uploads/news/${req.file.filename}`;
      console.log('   ✅ Nova imagem salva:', news.featuredImage);
    } else {
      console.log('\n⚠️  Mantendo imagem atual');
    }

    await news.save();

    console.log('\n✅ NOTÍCIA ATUALIZADA COM SUCESSO!');
    console.log('   Imagem final:', news.featuredImage);
    console.log('');

    req.flash('success', 'Notícia atualizada com sucesso!');
    res.redirect('/admin/news');

  } catch (error) {
    console.error('\n❌ ERRO AO ATUALIZAR:', error);
    req.flash('error', 'Erro ao atualizar notícia: ' + error.message);
    res.redirect(`/admin/news/${req.params.id}/edit`);
  }
};

// =============================================
// ADMIN - DELETAR NOTÍCIA
// =============================================
exports.adminDeleteNews = async (req, res) => {
  try {
    const { id } = req.params;
    const news = await News.findByPk(id);

    if (!news) {
      req.flash('error', 'Notícia não encontrada');
      return res.redirect('/admin/news');
    }

    // Deletar imagem associada
    if (news.featuredImage && 
        news.featuredImage !== '/images/news-default.jpg' &&
        !news.featuredImage.includes('news-default')) {
      
      const imagePath = path.join(__dirname, '..', 'public', news.featuredImage);
      if (fs.existsSync(imagePath)) {
        try {
          fs.unlinkSync(imagePath);
          console.log('🗑️  Imagem deletada:', news.featuredImage);
        } catch (err) {
          console.log('⚠️  Erro ao deletar imagem:', err.message);
        }
      }
    }

    await news.destroy();
    req.flash('success', 'Notícia deletada com sucesso!');
    res.redirect('/admin/news');

  } catch (error) {
    console.error('Erro ao deletar notícia:', error);
    req.flash('error', 'Erro ao deletar notícia');
    res.redirect('/admin/news');
  }
};

// =============================================
// ADMIN - TOGGLE PUBLICAÇÃO
// =============================================
exports.adminTogglePublish = async (req, res) => {
  try {
    const { id } = req.params;
    const news = await News.findByPk(id);

    if (!news) {
      return res.status(404).json({ error: 'Notícia não encontrada' });
    }

    news.isPublished = !news.isPublished;
    if (news.isPublished && !news.publishedAt) {
      news.publishedAt = new Date();
    }

    await news.save();

    res.json({
      success: true,
      isPublished: news.isPublished,
      message: news.isPublished ? 'Notícia publicada' : 'Notícia despublicada'
    });

  } catch (error) {
    console.error('Erro ao alternar publicação:', error);
    res.status(500).json({ error: 'Erro ao alternar publicação' });
  }
};