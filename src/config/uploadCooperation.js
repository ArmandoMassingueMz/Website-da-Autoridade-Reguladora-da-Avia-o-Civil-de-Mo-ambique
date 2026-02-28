// src/config/uploadCooperation.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Criar diretório se não existir
const uploadDir = path.join(__dirname, '../public/uploads/cooperations');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configuração do armazenamento
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'cooperation-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Filtro de arquivos - APENAS PDF
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Apenas arquivos PDF são permitidos!'), false);
  }
};

// Configuração do upload
const uploadCooperation = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // 10MB
  }
});

module.exports = uploadCooperation;