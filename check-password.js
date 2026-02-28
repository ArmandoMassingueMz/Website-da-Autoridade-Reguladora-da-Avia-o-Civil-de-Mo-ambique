// node check-password.js "admin123" "$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/eoOMT0yIz7KElGvEa"
const bcrypt = require('bcrypt');

(async () => {
  const [,, plain, hash] = process.argv;
  if (!plain || !hash) {
    console.log('Uso: node check-password.js <plainPassword> <hash>');
    process.exit(1);
  }
  console.log('plain length:', plain.length);
  console.log('hash length:', hash.length);
  const ok = await bcrypt.compare(plain, hash);
  console.log('bcrypt.compare ->', ok);
})();
