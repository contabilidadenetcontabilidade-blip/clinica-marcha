// Native fetch is available in Node 18+
(async () => {
    try {
        console.log("Testing Login API for Tamara...");
        const response = await fetch('http://localhost:8080/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: 'Tamara',
                password: 'admin' // implied from user request '•••••'
            })
        });

        const data = await response.json();
        console.log("Status:", response.status);
        console.log("Body:", data);

    } catch (e) {
        console.error("Error:", e.message);
    }
})();
