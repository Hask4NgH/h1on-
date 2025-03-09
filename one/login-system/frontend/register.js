function updateDateTime() {
    const now = new Date();
    const utcString = now.toISOString().split('.')[0].replace('T', ' ');
    document.querySelector('.datetime').textContent = utcString;
}

function showStatus(message, isError = false) {
    const statusElement = document.getElementById('statusMessage');
    statusElement.textContent = message;
    statusElement.className = 'status-message ' + (isError ? 'error' : 'success');
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

document.getElementById('registerForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    // Validações
    if (password !== confirmPassword) {
        showStatus('As senhas não coincidem!', true);
        return;
    }

    if (!isValidEmail(email)) {
        showStatus('Email inválido!', true);
        return;
    }

    // Recuperar usuários existentes
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    
    // Verificar se usuário já existe
    if (users.some(user => user.username === username)) {
        showStatus('Nome de usuário já existe!', true);
        return;
    }

    if (users.some(user => user.email === email)) {
        showStatus('Email já cadastrado!', true);
        return;
    }

    // Adicionar novo usuário
    users.push({
        username,
        email,
        password // Em uma aplicação real, a senha deve ser criptografada
    });

    localStorage.setItem('users', JSON.stringify(users));
    showStatus('Registro realizado com sucesso!');
    
    // Redirecionar para login após 2 segundos
    setTimeout(() => {
        window.location.href = 'login.html';
    }, 2000);
});

// Atualizar data/hora
setInterval(updateDateTime, 1000);
updateDateTime();