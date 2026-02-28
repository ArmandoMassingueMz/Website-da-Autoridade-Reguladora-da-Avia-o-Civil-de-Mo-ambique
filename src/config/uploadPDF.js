const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ✅ CORREÇÃO: Diretório correto de uploads
const uploadDir = path.join(__dirname, '../public/uploads/economic-regulations');

// Criar diretório se não existir
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configuração do storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'economic-doc-' + uniqueSuffix + ext);
    }
});

// Filtro para validar tipos de arquivo
const fileFilter = (req, file, cb) => {
    // ✅ Aceitar PDFs, Excel, Word, imagens
    const allowedTypes = [
        'application/pdf',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif'
    ];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Tipo de ficheiro não permitido. Apenas PDF, Excel, Word e imagens são aceites.'), false);
    }
};

const uploadPDF = multer({
    storage: storage,
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB
    },
    fileFilter: fileFilter
});

module.exports = uploadPDF;