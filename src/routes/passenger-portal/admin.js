const express = require('express');
const router  = express.Router();
const path    = require('path');
const fs      = require('fs');
const multer  = require('multer');

const adminController = require('../../controllers/passenger-portal/adminController');
const { requireAuth, requireRole } = require('../../middleware/auth');

// =============================================
// UPLOAD — apenas para rotas que recebem ficheiros
// =============================================
const portalUploadsBase = path.join(__dirname, '../../public/uploads/passenger-portal');

// Criar directórios necessários se não existirem
['news', 'rights', 'guides'].forEach(sub => {
  const dir = path.join(portalUploadsBase, sub);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Imagens para notícias
const uploadNewsImage = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, path.join(portalUploadsBase, 'news')),
    filename:    (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `news-${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`);
    }
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'].includes(file.mimetype)
      ? cb(null, true)
      : cb(new Error('Apenas imagens são permitidas (JPG, PNG, WEBP, GIF)'));
  }
});

// Documentos para direitos (PDF, DOC, DOCX)
const uploadRightsDoc = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, path.join(portalUploadsBase, 'rights')),
    filename:    (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `rights-${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`);
    }
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ].includes(file.mimetype)
      ? cb(null, true)
      : cb(new Error('Apenas PDF, DOC e DOCX são permitidos'));
  }
});

// ✅ NOVO: Documentos para guias de viagem (PDF, DOC, DOCX) — opcional
const uploadGuidesDoc = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, path.join(portalUploadsBase, 'guides')),
    filename:    (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `guide-${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`);
    }
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ].includes(file.mimetype)
      ? cb(null, true)
      : cb(new Error('Apenas PDF, DOC e DOCX são permitidos'));
  }
});

// =============================================
// MIDDLEWARE: Apenas passenger_admin e passenger_editor
// =============================================
router.use(requireAuth);
router.use(requireRole(['passenger_admin', 'passenger_editor']));

// =============================================
// DASHBOARD
// =============================================
router.get('/dashboard', adminController.dashboard);

// =============================================
// DIREITOS DOS PASSAGEIROS
// — form tem enctype="multipart/form-data" + campo "attachment"
// =============================================
router.get('/rights',             adminController.listRights);
router.get('/rights/create',      adminController.createRightForm);
router.post('/rights/create',     uploadRightsDoc.single('attachment'), adminController.createRight);
router.get('/rights/:id/edit',    adminController.editRightForm);
router.post('/rights/:id/edit',   uploadRightsDoc.single('attachment'), adminController.updateRight);
router.post('/rights/:id/delete', adminController.deleteRight);

// =============================================
// FAQs
// — form simples sem enctype, sem ficheiros
// =============================================
router.get('/faqs',             adminController.listFaqs);
router.get('/faqs/create',      adminController.createFaqForm);
router.post('/faqs/create',     adminController.createFaq);
router.get('/faqs/:id/edit',    adminController.editFaqForm);
router.post('/faqs/:id/edit',   adminController.updateFaq);
router.post('/faqs/:id/delete', adminController.deleteFaq);

// =============================================
// GUIAS DE VIAGEM
// ✅ CORRIGIDO: adicionado uploadGuidesDoc para processar enctype="multipart/form-data"
// O ficheiro "attachment" é opcional — se não for enviado, req.file será undefined
// =============================================
router.get('/guides',             adminController.listGuides);
router.get('/guides/create',      adminController.createGuideForm);
router.post('/guides/create',     uploadGuidesDoc.single('attachment'), adminController.createGuide);
router.get('/guides/:id/edit',    adminController.editGuideForm);
router.post('/guides/:id/edit',   uploadGuidesDoc.single('attachment'), adminController.updateGuide);
router.post('/guides/:id/delete', adminController.deleteGuide);

// =============================================
// RECLAMAÇÕES
// =============================================
router.get('/complaints',             adminController.listComplaints);
router.get('/complaints/:id',         adminController.viewComplaint);
router.post('/complaints/:id/status', adminController.updateComplaintStatus);
router.post('/complaints/:id/note',   adminController.addComplaintNote);
router.post('/complaints/:id/delete', adminController.deleteComplaint);

// =============================================
// REGRAS DE COMPENSAÇÃO
// — form simples sem enctype, sem ficheiros
// =============================================
router.get('/compensation',             adminController.listCompensation);
router.get('/compensation/create',      adminController.createCompensationForm);
router.post('/compensation/create',     adminController.createCompensation);
router.get('/compensation/:id/edit',    adminController.editCompensationForm);
router.post('/compensation/:id/edit',   adminController.updateCompensation);
router.post('/compensation/:id/delete', adminController.deleteCompensation);

// =============================================
// NOTÍCIAS DO PORTAL
// — form tem enctype="multipart/form-data" + campo "featured_image"
// =============================================
router.get('/news',             adminController.listNews);
router.get('/news/create',      adminController.createNewsForm);
router.post('/news/create',     uploadNewsImage.single('featured_image'), adminController.createNews);
router.get('/news/:id/edit',    adminController.editNewsForm);
router.post('/news/:id/edit',   uploadNewsImage.single('featured_image'), adminController.updateNews);
router.post('/news/:id/delete', adminController.deleteNews);

// =============================================
// TRATAMENTO DE ERROS DE UPLOAD
// =============================================
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError || err.message) {
    console.error('❌ Erro de upload:', err.message);
    req.flash('error', `Erro de upload: ${err.message}`);
    return res.redirect(req.get('Referrer') || '/portal-passageiro/admin/dashboard');
  }
  next(err);
});

module.exports = router;