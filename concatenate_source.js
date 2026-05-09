const fs = require('fs');
const path = require('path');

const ROOT_DIR = 'c:\\Marcha';
const OUTPUT_FILE = path.join(ROOT_DIR, 'full_source_code.txt');
const EXTENSIONS = ['.html', '.js', '.css'];
const IGNORE_DIRS = ['node_modules', '.git', '.gemini', 'brain', 'dist', 'bin', 'obj'];

if (fs.existsSync(OUTPUT_FILE)) {
    fs.unlinkSync(OUTPUT_FILE);
}

function walkSync(dir, callback) {
    const files = fs.readdirSync(dir);
    files.forEach((file) => {
        const filePath = path.join(dir, file);
        const stats = fs.statSync(filePath);

        if (stats.isDirectory()) {
            if (!IGNORE_DIRS.includes(file)) {
                walkSync(filePath, callback);
            }
        } else {
            callback(filePath);
        }
    });
}

console.log(`Iniciando concatenação em ${ROOT_DIR}...`);
let fileCount = 0;

walkSync(ROOT_DIR, (filePath) => {
    const ext = path.extname(filePath).toLowerCase();
    if (EXTENSIONS.includes(ext) && filePath !== OUTPUT_FILE) {
        const relativePath = path.relative(ROOT_DIR, filePath);
        const content = fs.readFileSync(filePath, 'utf8');
        
        const header = `\n\n${'='.repeat(80)}\nFILE: ${relativePath}\n${'='.repeat(80)}\n\n`;
        fs.appendFileSync(OUTPUT_FILE, header + content);
        
        console.log(`Concatenado: ${relativePath}`);
        fileCount++;
    }
});

console.log(`\nConcluído! ${fileCount} arquivos concatenados em: ${OUTPUT_FILE}`);
