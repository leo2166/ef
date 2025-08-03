// Script para ejecutarse en entorno Node.js
const fs = require('fs');
const files = [
  
  'pantalla2.html',
  'pantalla2.css',
  'pantalla2.js',
 
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
fs.writeFileSync('codigo_completo2.txt', output);
console.log('✅ Archivo "codigo_completo2.txt" generado con éxito.');
