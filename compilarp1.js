// Script para ejecutarse en entorno Node.js
const fs = require('fs');
const files = [
  'index.html',
  'styles.css',
  'app.js',
  
];

let output = '📁 Código fuente completo de la app\n\n';

files.forEach((file, i) => {
  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, 'utf8');
    output += `\n\n${i + 1}. ${file}\n${'-'.repeat(file.length + 3)}\n${content}\n`;
  } else {
    output += `\n\n${i + 1}. ${file}\n${'-'.repeat(file.length + 3)}\n⚠️ Archivo no encontrado.\n`;
  }
});

// Guarda en archivo .txt
fs.writeFileSync('codigo_completo1.txt', output);
console.log('✅ Archivo "codigo_completo1.txt" generado con éxito.');
