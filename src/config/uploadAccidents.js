// src/config/uploadAccidents.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Criar diretórios se não existirem
const pdfDir = path.join(__dirname, '../public/uploads/accidents/pdfs');
const imageDir = path.join(__dirname, '../public/uploads/accidents/images');

if (!fs.existsSync(pdfDir)) {
  fs.mkdirSync(pdfDir, { recursive: true });
}
if (!fs.existsSync(imageDir)) {
  fs.mkdirSync(imageDir, { recursive: true });
}

// Configuração de storage dinâmico
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (file.fieldname === 'pdfFile') {
      cb(null, pdfDir);
    } else if (file.fieldname === 'imageFile') {
      cb(null, imageDir);
    } else {
      cb(new Error('Campo de arquivo inválido'));
    }
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    const prefix = file.fieldname === 'pdfFile' ? 'accident-pdf-' : 'accident-img-';
    cb(null, prefix + uniqueSuffix + extension);
  }
});

// Filtro de arquivos
const fileFilter = (req, file, cb) => {
  if (file.fieldname === 'pdfFile') {
    // Aceitar apenas PDFs
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Apenas arquivos PDF são permitidos para documentos!'), false);
    }
  } else if (file.fieldname === 'imageFile') {
    // Aceitar apenas imagens
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Apenas arquivos de imagem são permitidos!'), false);
    }
  } else {
    cb(new Error('Campo de arquivo inválido'), false);
  }
};

// Configuração do upload
const uploadAccidents = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // 10MB
  }
});

module.exports = uploadAccidents;