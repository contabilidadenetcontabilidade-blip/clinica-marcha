
const fs = require('fs');
const path = require('path');

const files = [
    path.join(__dirname, 'index.js'),
    path.join(__dirname, 'db.js'),
    path.join(__dirname, '../frontend/login.js'),
    path.join(__dirname, '../frontend/style.css'),
    path.join(__dirname, '../frontend/index.html'),
    path.join(__dirname, '../frontend/regras.js')
];

files.forEach(f => {
    if (!fs.existsSync(f)) {
        console.log(`File ${f} not found, skipping.`);
        return;
    }

    console.log(`Cleaning ${f}...`);
    let content = fs.readFileSync(f, 'utf8');

    // Look for the metadata junk indicators
    // It usually starts with something like "file:///C:/Marcha" or the arrows
    // Or just look for "*cascade"

    const markers = ["*cascade", "file:///C:/Marcha", "\u2192\u263A\u2192\u263B"];
    let splitIdx = -1;

    for (const marker of markers) {
        const idx = content.indexOf(marker);
        if (idx !== -1) {
            if (splitIdx === -1 || idx < splitIdx) {
                splitIdx = idx;
            }
        }
    }

    if (splitIdx !== -1) {
        // Find the last legitimate ending before this junk
        // For JS/CSS/JSON, it's usually ; or }
        // For HTML, it's >
        let endIdx = splitIdx;
        while (endIdx > 0) {
            const char = content[endIdx - 1];
            if (char === ';' || char === '}' || char === '>') {
                break;
            }
            endIdx--;
        }

        if (endIdx > 0) {
            const cleanContent = content.slice(0, endIdx);
            fs.writeFileSync(f, cleanContent, 'utf8');
            console.log(`  SUCCESS: Cleaned at index ${endIdx}`);
        } else {
            // If no terminator found, just cut at splitIdx
            const cleanContent = content.slice(0, splitIdx).trim();
            fs.writeFileSync(f, cleanContent, 'utf8');
            console.log(`  WARNING: Cut at marker index ${splitIdx} (no formal terminator found)`);
        }
    } else {
        // Fallback: look for suspicious non-ascii characters at the end
        const regex = /[\u0000-\u0008\u000E-\u001F\u007F-\uFFFF]{5,}/g;
        const match = regex.exec(content);
        if (match) {
            console.log(`  Found suspicious characters at index ${match.index}`);
            const cleanContent = content.slice(0, match.index).trim();
            fs.writeFileSync(f, cleanContent, 'utf8');
            console.log(`  SUCCESS: Cut before suspicious characters`);
        } else {
            console.log(`  No junk detected.`);
        }
    }
});
