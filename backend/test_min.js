const express = require('express');

const app = express();
const port = 3000;

app.get('/*', (req, res) => res.send('OK'));

app.listen(port, '0.0.0.0', () => {
    console.log(`Backend MINIMO rodando na porta ${port}`);
});

// Forçar loop vivo (hack)
setInterval(() => { }, 10000);
