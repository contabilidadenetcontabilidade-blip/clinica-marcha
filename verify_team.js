const http = require('http');

function checkType(type) {
    const options = {
        hostname: 'localhost',
        port: 3000,
        path: `/api/patients?type=${type}`,
        method: 'GET'
    };

    const req = http.request(options, res => {
        let body = '';
        res.on('data', d => body += d);
        res.on('end', () => {
            try {
                const users = JSON.parse(body);
                console.log(`TYPE: ${type}`);
                console.log("Count:", users.length);
                if (users.length > 0)
                    console.log("Samples:", users.slice(0, 3).map(u => `${u.name} (${u.role || 'null'})`));
                else
                    console.log("No results.");
                console.log("---");
            } catch (e) { console.log(e); }
        });
    });
    req.end();
}

setTimeout(() => checkType('student'), 1000);
setTimeout(() => checkType('team'), 2000);
