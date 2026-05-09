
const fs = require('fs');
const files = ['index.js', 'db.js', '../frontend/login.js', '../frontend/style.css', '../frontend/index.html', '../frontend/regras.js'];

files.forEach(f => {
    try {
        if (!fs.existsSync(f)) return;
        const buffer = fs.readFileSync(f);

        // Find "*cascade" sequence
        const marker = Buffer.from('*cascade');
        const index = buffer.indexOf(marker);

        if (index !== -1) {
            // Cut at index, then go back to the last legit character (}, ;, > or newline)
            let end = index;
            while (end > 0 && buffer[end - 1] > 127) { // Skip non-ascii symbols like →☺
                end--;
            }
            // Trim any more symbols
            while (end > 0 && buffer[end - 1] < 32 && buffer[end - 1] !== 10 && buffer[end - 1] !== 13) {
                end--;
            }

            const clean = buffer.slice(0, end);
            fs.writeFileSync(f, clean);
            console.log(`Buffer cleaned ${f}`);
        }
    } catch (e) { console.error(e.message); }
});
