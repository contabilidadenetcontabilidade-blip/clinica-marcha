const http = require('http');

http.get('http://localhost:3000/api/ranking', (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        console.log('STATUS:', res.statusCode);
        console.log('HEADERS:', res.headers);
        console.log('BODY:', data);
        process.exit();
    });
}).on('error', (err) => {
    console.error('ERROR:', err.message);
    process.exit();
});
