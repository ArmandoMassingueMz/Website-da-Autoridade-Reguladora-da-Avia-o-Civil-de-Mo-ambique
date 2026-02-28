const express = require('express');
const router = express.Router();
const adminController = require('../../controllers/passenger-portal/adminController');
const { requireAuth, requireRole } = require('../../middleware/auth');

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
// =============================================
router.get('/rights', adminController.listRights);
router.get('/rights/create', adminController.createRightForm);
router.post('/rights/create', adminController.createRight);
router.get('/rights/:id/edit', adminController.editRightForm);
router.post('/rights/:id/edit', adminController.updateRight);
router.post('/rights/:id/delete', adminController.deleteRight);

// =============================================
// FAQs
// =============================================
router.get('/faqs', adminController.listFaqs);
router.get('/faqs/create', adminController.createFaqForm);
router.post('/faqs/create', adminController.createFaq);
router.get('/faqs/:id/edit', adminController.editFaqForm);
router.post('/faqs/:id/edit', adminController.updateFaq);
router.post('/faqs/:id/delete', adminController.deleteFaq);

// =============================================
// GUIAS DE VIAGEM
// =============================================
router.get('/guides', adminController.listGuides);
router.get('/guides/create', adminController.createGuideForm);
router.post('/guides/create', adminController.createGuide);
router.get('/guides/:id/edit', adminController.editGuideForm);
router.post('/guides/:id/edit', adminController.updateGuide);
router.post('/guides/:id/delete', adminController.deleteGuide);

// =============================================
// RECLAMAÇÕES
// =============================================
router.get('/complaints', adminController.listComplaints);
router.get('/complaints/:id', adminController.viewComplaint);
router.post('/complaints/:id/status', adminController.updateComplaintStatus);
router.post('/complaints/:id/note', adminController.addComplaintNote);
router.post('/complaints/:id/delete', adminController.deleteComplaint);

// =============================================
// REGRAS DE COMPENSAÇÃO
// =============================================
router.get('/compensation', adminController.listCompensation);
router.get('/compensation/create', adminController.createCompensationForm);
router.post('/compensation/create', adminController.createCompensation);
router.get('/compensation/:id/edit', adminController.editCompensationForm);
router.post('/compensation/:id/edit', adminController.updateCompensation);
router.post('/compensation/:id/delete', adminController.deleteCompensation);

// =============================================
// NOTÍCIAS DO PORTAL
// =============================================
router.get('/news', adminController.listNews);
router.get('/news/create', adminController.createNewsForm);
router.post('/news/create', adminController.createNews);
router.get('/news/:id/edit', adminController.editNewsForm);
router.post('/news/:id/edit', adminController.updateNews);
router.post('/news/:id/delete', adminController.deleteNews);

module.exports = router;