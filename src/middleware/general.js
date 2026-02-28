// Middleware para medir tempo de resposta
const responseTime = (req, res, next) => {
    const start = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - start;
      console.log(`${req.method} ${req.originalUrl} - ${duration}ms`);
    });
    
    next();
  };
  
  // Middleware para segurança básica
  const securityHeaders = (req, res, next) => {
    // Prevenir clickjacking
    res.setHeader('X-Frame-Options', 'DENY');
    
    // Prevenir XSS
    res.setHeader('X-XSS-Protection', '1; mode=block');
    
    // Prevenir MIME sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');
    
    // Política de referrer
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    next();
  };
  
  // Middleware para manutenção
  const maintenanceMode = (req, res, next) => {
    if (process.env.MAINTENANCE_MODE === 'true') {
      return res.status(503).render('pages/maintenance', {
        title: 'Em Manutenção - IACM',
        currentPage: 'maintenance'
      });
    }
    next();
  };
  
  module.exports = {
    responseTime,
    securityHeaders,
    maintenanceMode
  };