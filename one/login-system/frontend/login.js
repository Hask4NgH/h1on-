function updateDateTime() {
    const now = new Date();
    const utcString = now.toISOString().split('.')[0].replace('T', ' ');
    document.querySelector('.datetime').textContent = 
        `Current Date and Time (UTC - YYYY-MM-DD HH:MM:SS formatted): ${utcString}`;
}

function showStatus(message, isError = false) {
    const statusElement = document.getElementById('statusMessage');
    statusElement.textContent = message;
    statusElement.className = 'status-message ' + (isError ? 'error' : 'success');
}

// Função para enviar o código de verificação
async function sendVerificationEmail(email, username) {
    try {
        const response = await fetch('http://localhost:3000/api/send-verification', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, username })
        });

        const data = await response.json();
        if (!data.success) {
            throw new Error(data.message);
        }
        return true;
    } catch (error) {
        console.error('Erro ao enviar código:', error);
        showStatus('Erro ao enviar código de verificação: ' + error.message, true);
        return false;
    }
}

// Função para verificar o código
async function verifyCode(email, code) {
    try {
        const response = await fetch('http://localhost:3000/api/verify-code', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, code })
        });

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Erro ao verificar código:', error);
        return { 
            success: false, 
            message: 'Erro ao verificar código: ' + error.message 
        };
    }
}

let currentUserData = null;

document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    // Recuperar usuários do localStorage
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find(u => 
        u.username === username && 
        u.email === email && 
        u.password === password
    );
    
    if (user) {
        currentUserData = user;
        
        showStatus('Verificando credenciais...');
        
        // Enviar código por email usando a API real
        const emailSent = await sendVerificationEmail(email, username);
        
        if (emailSent) {
            // Mostrar container de verificação
            document.getElementById('loginContainer').style.display = 'none';
            document.getElementById('verificationContainer').style.display = 'block';
            showStatus('Código de verificação enviado para seu email.');
        }
    } else {
        showStatus('Credenciais inválidas!', true);
    }
});

document.getElementById('verificationForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const inputCode = document.getElementById('verificationCode').value;
    
    // Verificar código usando a API
    const verificationResult = await verifyCode(currentUserData.email, inputCode);
    
    if (verificationResult.success) {
        showStatus('Login realizado com sucesso!');
        
        // Salvar dados do usuário logado
        localStorage.setItem('currentUser', JSON.stringify({
            username: currentUserData.username,
            email: currentUserData.email
        }));
        
        // Redirecionar após 1 segundo
        setTimeout(() => {
            // Verificar se estamos rodando no Electron
            if (window && window.process && window.process.type) {
                // Ambiente Electron
                const path = require('path');
                window.location.href = path.join(__dirname, '../../dashboardscript/index.html');
            } else {
                // Ambiente Web
                window.location.href = 'C:/Users/Administrator/Downloads/one/dashboardscript/index.html';
            }
        }, 1000);
    } else {
        showStatus(verificationResult.message, true);
    }
});