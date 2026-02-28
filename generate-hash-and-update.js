// node generate-hash-and-update.js admin@iacm.gov.mz admin123
const bcrypt = require('bcrypt');

(async () => {
  const [,, email, password] = process.argv;

  if (!email || !password) {
    console.log('Uso: node generate-hash-and-update.js <email> <password>');
    process.exit(1);
  }

  // Gerar hash bcrypt válido
  const hash = await bcrypt.hash(password, 12);
  console.log('Novo hash gerado (copia este):\n', hash);

  console.log('\nSQL para actualizar a password do super admin:');
  console.log(`UPDATE users SET password = '${hash}' WHERE email = '${email}';`);
})();
