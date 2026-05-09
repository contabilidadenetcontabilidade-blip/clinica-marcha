const http = require('http');

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/patients',
    method: 'GET'
};

const req = http.request(options, res => {
    console.log(`statusCode: ${res.statusCode}`);
    let body = '';
    res.on('data', d => body += d);
    res.on('end', () => {
        try {
            const users = JSON.parse(body);
            if (Array.isArray(users)) {
                console.log("Count:", users.length);
                console.log("Sample Names:", users.slice(0, 3).map(u => u.name));
                console.log("Admins present?", users.some(u => u.name.toLowerCase().includes('admin')));
            } else {
                console.log("Response:", body.slice(0, 100));
            }
        } catch (e) {
            console.log("Body:", body);
        }
    });
});

req.on('error', error => {
    console.error(error);
});

req.end();
