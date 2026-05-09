
const fs = require('fs');
const snapPath = 'C:\\Users\\Glaubert\\.gemini\\antigravity\\code_tracker\\active\\Marcha_8976f8b197353ac03fd8585f373e001e5c61dd74\\e33ca812e795bfdca8cd98b83791ae8c_index.js';

try {
    const raw = fs.readFileSync(snapPath);
    let str = raw.toString('utf8');

    const startIdx = str.indexOf('require');
    if (startIdx !== -1) str = str.slice(startIdx);

    // Find the very last app.listen
    const listenIdx = str.lastIndexOf('app.listen');
    if (listenIdx !== -1) {
        // Find the closure }); after this listen
        const closureIdx = str.indexOf('});', listenIdx);
        if (closureIdx !== -1) {
            const finalStr = str.slice(0, closureIdx + 3);
            fs.writeFileSync('index.js', finalStr, 'utf8');
            console.log("Extracted index.js successfully with the last app.listen");
        } else {
            // Maybe it's just app.listen(port, ...) without a callback?
            // Or maybe it ends with );
            const closureIdx2 = str.indexOf(');', listenIdx);
            if (closureIdx2 !== -1) {
                const finalStr = str.slice(0, closureIdx2 + 2);
                fs.writeFileSync('index.js', finalStr, 'utf8');
                console.log("Extracted index.js successfully with simple listen");
            }
        }
    } else {
        console.error("Could not find app.listen");
    }
} catch (e) {
    console.error(e.message);
}
