const express = require('express');
const router = express.Router();
const publicController = require('../../controllers/passenger-portal/publicController');

// =============================================
// ROTAS PÚBLICAS DO PORTAL DO PASSAGEIRO
// =============================================

// Página inicial
router.get('/', publicController.home);

// Direitos dos Passageiros
router.get('/direitos', publicController.direitos);
router.get('/direitos/:category', publicController.direitosByCategory);

// Guias de Viagem
router.get('/antes-viagem', publicController.antesViagem);
router.get('/aeroporto', publicController.aeroporto);
router.get('/durante-voo', publicController.duranteVoo);
router.get('/destino', publicController.destino);

// FAQs
router.get('/faq', publicController.faq);

// Reclamações
router.get('/reclamacoes', publicController.reclamacoesForm);
router.post('/reclamacoes', publicController.submitReclamacao);

// Simulador
router.get('/simulador', publicController.simulador);
router.post('/simulador/calcular', publicController.calcularDireitos);

// Glossário
router.get('/glossario', publicController.glossario);

// Notícias
router.get('/noticias', publicController.noticias);
router.get('/noticias/:slug', publicController.noticiaDetail);

module.exports = router;