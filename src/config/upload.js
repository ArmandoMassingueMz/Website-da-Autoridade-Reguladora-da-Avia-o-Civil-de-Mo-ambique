// src/config/upload.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// =============================================
// CRIAR DIRETÓRIOS DE UPLOADS SE NÃO EXISTIREM
// =============================================
const createUploadDirs = () => {
  const dirs = [
    '../public/uploads',
    '../public/uploads/news',
    '../public/uploads/laws',
    '../public/uploads/forms',
    '../public/uploads/regulations',
    '../public/uploads/economic-regulations',
    '../public/uploads/accidents',
    '../public/uploads/cooperations',
    '../public/uploads/staff',
    '../public/uploads/general',
    '../public/uploads/other-services', // ✅ PASTA EM FALTA - ADICIONADA
    '../public/uploads/team'             // ✅ PASTA EM FALTA - ADICIONADA
  ];
  
  dirs.forEach(dir => {
    const fullPath = path.join(__dirname, dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
      console.log(`📁 Pasta criada: ${fullPath}`);
    }
  });
};

createUploadDirs();

// =============================================
// CONFIGURAÇÃO PARA NOTÍCIAS (IMAGENS)
// =============================================
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../public/uploads/news'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, 'news-' + uniqueSuffix + extension);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Apenas arquivos de imagem são permitidos!'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024
  }
});

// =============================================
// CONFIGURAÇÃO PARA LEIS E DECRETOS (PDF, DOC, DOCX)
// =============================================
const storageLaws = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(__dirname, '../public/uploads/laws');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname).toLowerCase();
    const originalName = path.basename(file.originalname, path.extname(file.originalname));
    const safeName = originalName.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚàèìòùÀÈÌÒÙãõÃÕâêîôûÂÊÎÔÛçÇ\s-]/g, '');
    cb(null, `${safeName.substring(0, 50)}-${uniqueSuffix}${extension}`);
  }
});

const fileFilterLaws = (req, file, cb) => {
  const allowedMimes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Tipo de arquivo não permitido: ${file.mimetype}. Apenas PDF, DOC, DOCX são permitidos!`), false);
  }
};

const uploadLaws = multer({
  storage: storageLaws,
  fileFilter: fileFilterLaws,
  limits: { fileSize: 50 * 1024 * 1024 }
});

// =============================================
// CONFIGURAÇÃO PARA FORMULÁRIOS (PDF)
// =============================================
const storageForms = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(__dirname, '../public/uploads/forms');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname).toLowerCase();
    const originalName = path.basename(file.originalname, path.extname(file.originalname));
    const safeName = originalName.replace(/[^a-zA-Z0-9\s-]/g, '');
    cb(null, `form-${safeName.substring(0, 30)}-${uniqueSuffix}${extension}`);
  }
});

const uploadForms = multer({
  storage: storageForms,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Apenas arquivos PDF são permitidos para formulários!'), false);
    }
  },
  limits: { fileSize: 50 * 1024 * 1024 }
});

// =============================================
// CONFIGURAÇÃO PARA REGULAÇÕES ECONÔMICAS (PDF)
// =============================================
const storageEconomicRegulations = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(__dirname, '../public/uploads/economic-regulations');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, 'economic-regulation-' + uniqueSuffix + extension);
  }
});

const uploadEconomicRegulations = multer({
  storage: storageEconomicRegulations,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Apenas arquivos PDF são permitidos!'), false);
    }
  },
  limits: { fileSize: 50 * 1024 * 1024 }
});

// =============================================
// CONFIGURAÇÃO GERAL PARA OUTROS ARQUIVOS
// =============================================
const storageGeneral = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(__dirname, '../public/uploads/general');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, 'file-' + uniqueSuffix + extension);
  }
});

const uploadGeneral = multer({
  storage: storageGeneral,
  limits: { fileSize: 50 * 1024 * 1024 }
});

// =============================================
// CONFIGURAÇÃO PARA OTHER-SERVICES (PDF) ✅ NOVO
// =============================================
const storageOtherServices = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(__dirname, '../public/uploads/other-services');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, 'service-' + uniqueSuffix + extension);
  }
});

const uploadOtherServices = multer({
  storage: storageOtherServices,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Apenas arquivos PDF são permitidos!'), false);
    }
  },
  limits: { fileSize: 50 * 1024 * 1024 }
});

// =============================================
// EXPORTAR TODOS OS MIDDLEWARES
// =============================================
module.exports = upload;
module.exports.uploadLaws = uploadLaws;
module.exports.uploadForms = uploadForms;
module.exports.uploadEconomicRegulations = uploadEconomicRegulations;
module.exports.uploadGeneral = uploadGeneral;
module.exports.uploadOtherServices = uploadOtherServices; // ✅ NOVO

// Função auxiliar para verificar se um arquivo existe
module.exports.fileExists = (filePath) => {
  return fs.existsSync(filePath);
};

// Função auxiliar para remover arquivo
module.exports.removeFile = (filePath) => {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    return true;
  }
  return false;
};