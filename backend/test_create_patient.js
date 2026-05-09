const http = require('http');

const data = JSON.stringify({
    name: 'Paciente Teste CPF',
    cpf: '111.222.333-44',
    phone: '11999999999'
});

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/patients',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

const req = http.request(options, (res) => {
    let responseData = '';
    res.on('data', (chunk) => {
        responseData += chunk;
    });

    res.on('end', () => {
        console.log(`Status: ${res.statusCode}`);
        console.log(`Body: ${responseData}`);
    });
});

req.on('error', (error) => {
    console.error(error);
});

req.write(data);
req.end();
