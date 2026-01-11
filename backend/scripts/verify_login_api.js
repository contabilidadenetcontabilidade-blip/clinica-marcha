// Native fetch is available in Node 18+
(async () => {
    try {
        console.log("Testing Login API...");
        const response = await fetch('http://localhost:8080/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: 'aluno.flow2',
                password: '123'
            })
        });

        const data = await response.json();
        console.log("Status:", response.status);
        console.log("Body:", data);

        if (response.status === 200 && (data.name === 'Aluno Flow 2' || data.username === 'aluno.flow2')) {
            console.log("✅ LOGIN SUCCESS! Fix verified.");
        } else {
            console.log("❌ LOGIN FAILED.");
        }
    } catch (e) {
        console.error("Error:", e.message);
    }
})();
