// controllers/newsController.js
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
      include: [{ model: User, as: 'author', attributes: ['name'] }],
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
      include: [{ model: User, as: 'author', attributes: ['name'] }],
      order: [['createdAt', 'DESC']]
    });

    res.render('admin/news/index', {
      title: 'Gestão de Notícias - IACM',
      currentPage: 'news',
      user: req.session.user,
      messages: req.flash(),
      news,
      layout: 'layouts/admin'
    });
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
  res.render('admin/news/create', {
    title: 'Criar Notícia - IACM',
    currentPage: 'news',
    user: req.session.user,
    messages: req.flash(),
    layout: 'layouts/admin'
  });
};

// =============================================
// ADMIN - CRIAR NOTÍCIA (COM UPLOAD DE IMAGEM)
// =============================================
exports.adminCreateNews = async (req, res) => {
  try {
    const { title, excerpt, content, isPublished } = req.body;

    if (!title || !excerpt || !content) {
      req.flash('error', 'Título, resumo e conteúdo são obrigatórios');
      return res.redirect('/admin/news/create');
    }

    const baseSlug = title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();

    const slug = `${baseSlug}-${Date.now()}`;

    let featuredImage = '/images/news-default.jpg';
    if (req.file) {
      featuredImage = `/uploads/news/${req.file.filename}`;
      console.log('✅ Imagem guardada:', featuredImage);
    }

    await News.create({
      title,
      slug,
      excerpt,
      content,
      featuredImage,
      isPublished: isPublished === 'on',
      publishedAt: isPublished === 'on' ? new Date() : null,
      authorId: req.session.user.id  // ✅ CORRIGIDO: era req.user.id
    });

    req.flash('success', 'Notícia criada com sucesso!');
    res.redirect('/admin/news');

  } catch (error) {
    console.error('❌ Erro ao criar notícia:', error.message);
    req.flash('error', 'Erro ao criar notícia: ' + error.message);
    res.redirect('/admin/news/create');
  }
};

// =============================================
// ADMIN - MOSTRAR FORM DE EDITAR NOTÍCIA
// =============================================
exports.adminEditNewsForm = async (req, res) => {
  try {
    const news = await News.findByPk(req.params.id);

    if (!news) {
      req.flash('error', 'Notícia não encontrada');
      return res.redirect('/admin/news');
    }

    res.render('admin/news/edit', {
      title: 'Editar Notícia - IACM',
      currentPage: 'news',
      user: req.session.user,
      messages: req.flash(),
      news,
      layout: 'layouts/admin'
    });
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
    const { title, excerpt, content, isPublished } = req.body;

    const news = await News.findByPk(req.params.id);
    if (!news) {
      req.flash('error', 'Notícia não encontrada');
      return res.redirect('/admin/news');
    }

    news.title = title;
    news.excerpt = excerpt;
    news.content = content;
    news.isPublished = isPublished === 'on';

    if (news.isPublished && !news.publishedAt) {
      news.publishedAt = new Date();
    }

    if (req.file) {
      // Apagar imagem antiga se não for a padrão
      if (news.featuredImage && news.featuredImage !== '/images/news-default.jpg') {
        const oldPath = path.join(__dirname, '..', 'public', news.featuredImage);
        if (fs.existsSync(oldPath)) {
          try { fs.unlinkSync(oldPath); } catch (e) {}
        }
      }
      news.featuredImage = `/uploads/news/${req.file.filename}`;
      console.log('✅ Nova imagem guardada:', news.featuredImage);
    }

    await news.save();

    req.flash('success', 'Notícia atualizada com sucesso!');
    res.redirect('/admin/news');

  } catch (error) {
    console.error('❌ Erro ao atualizar notícia:', error);
    req.flash('error', 'Erro ao atualizar notícia: ' + error.message);
    res.redirect(`/admin/news/${req.params.id}/edit`);
  }
};

// =============================================
// ADMIN - DELETAR NOTÍCIA
// =============================================
exports.adminDeleteNews = async (req, res) => {
  try {
    const news = await News.findByPk(req.params.id);

    if (!news) {
      req.flash('error', 'Notícia não encontrada');
      return res.redirect('/admin/news');
    }

    if (news.featuredImage && news.featuredImage !== '/images/news-default.jpg') {
      const imagePath = path.join(__dirname, '..', 'public', news.featuredImage);
      if (fs.existsSync(imagePath)) {
        try { fs.unlinkSync(imagePath); } catch (e) {}
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
    const news = await News.findByPk(req.params.id);

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