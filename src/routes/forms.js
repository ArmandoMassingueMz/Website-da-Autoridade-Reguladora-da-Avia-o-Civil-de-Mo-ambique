const express = require('express');
const router = express.Router();
const formController = require('../controllers/formController');
const { requireAuth, requireRole } = require('../middleware/auth');

// Configuração do multer para upload de PDFs
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Criar diretório se não existir
const formsDir = path.join(__dirname, '../public/uploads/forms');
if (!fs.existsSync(formsDir)) {
  fs.mkdirSync(formsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, formsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, 'form-' + uniqueSuffix + extension);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Apenas arquivos PDF são permitidos'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
});

// =============================================
// ROTAS ADMINISTRATIVAS
// =============================================

// Listar todos os formulários (admin)
router.get('/', requireAuth, requireRole(['admin', 'super_admin']), formController.index);

// Formulário de criação
router.get('/create', requireAuth, requireRole(['admin', 'super_admin']), formController.create);

// Processar criação
router.post('/', 
  requireAuth, 
  requireRole(['admin', 'super_admin']), 
  upload.single('pdfFile'),
  formController.store
);

// Formulário de edição
router.get('/:id/edit', requireAuth, requireRole(['admin', 'super_admin']), formController.edit);

// Processar edição
router.post('/:id', 
  requireAuth, 
  requireRole(['admin', 'super_admin']), 
  upload.single('pdfFile'),
  formController.update
);

// Excluir formulário
router.post('/:id/delete', requireAuth, requireRole(['admin', 'super_admin']), formController.destroy);

// =============================================
// ROTAS PÚBLICAS (API)
// =============================================

// Listar todos os formulários públicos
router.get('/api/forms', formController.getAllForms);

// Listar formulários por categoria
router.get('/api/forms/category/:category', formController.getFormsByCategory);

// Incrementar contador de downloads
router.post('/api/forms/:id/download', formController.incrementDownload);

module.exports = router;