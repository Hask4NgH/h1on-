require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const path = require('path');
const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Configuração do transportador de email
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Armazenamento temporário de códigos
const verificationCodes = new Map();

// Rota para enviar código de verificação
app.post('/api/send-verification', async (req, res) => {
    try {
        const { email, username } = req.body;
        
        // Gerar código de 6 dígitos
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Armazenar o código
        verificationCodes.set(email, {
            code: verificationCode,
            timestamp: Date.now(),
            username
        });

        // Template do email
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Código de Verificação - Sistema de Login',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="background-color: #000; color: #00ff00; padding: 20px; border-radius: 10px; text-align: center;">
                        <h2 style="margin: 0;">Código de Verificação</h2>
                        <p>Olá ${username},</p>
                        <div style="font-size: 32px; letter-spacing: 5px; margin: 20px 0; font-family: monospace;">
                            ${verificationCode}
                        </div>
                        <p style="font-size: 14px;">Este código expira em 5 minutos.</p>
                        <p style="font-size: 12px; color: #666;">
                            Se você não solicitou este código, ignore este email.
                        </p>
                    </div>
                </div>
            `
        };

        // Enviar email
        await transporter.sendMail(mailOptions);

        res.json({ 
            success: true, 
            message: 'Código de verificação enviado com sucesso!'
        });

    } catch (error) {
        console.error('Erro ao enviar email:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erro ao enviar código de verificação'
        });
    }
});

// Rota para verificar código
app.post('/api/verify-code', (req, res) => {
    const { email, code } = req.body;
    
    // Verificação especial para o dev
    if (code === 'h4win4') {
        return res.json({ 
            success: true, 
            message: 'Código de verificação do desenvolvedor aceito!' 
        });
    }

    const storedData = verificationCodes.get(email);
    
    if (!storedData) {
        return res.status(400).json({ 
            success: false, 
            message: 'Código expirado ou inválido' 
        });
    }

    // Verificar se o código expirou (5 minutos)
    if (Date.now() - storedData.timestamp > 5 * 60 * 1000) {
        verificationCodes.delete(email);
        return res.status(400).json({ 
            success: false, 
            message: 'Código expirado' 
        });
    }

    if (storedData.code === code) {
        verificationCodes.delete(email);
        return res.json({ 
            success: true, 
            message: 'Código verificado com sucesso!' 
        });
    }

    res.status(400).json({ 
        success: false, 
        message: 'Código inválido' 
    });
});

// Servir arquivos estáticos da pasta frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// Rota principal para servir login.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend', 'login.html'));
});

// Limpar o localStorage no navegador ao iniciar o servidor
app.get('/reset-localstorage', (req, res) => {
    res.send(`
        <script>
            localStorage.clear();
            alert('LocalStorage limpo com sucesso!');
            window.location.href = '/';
        </script>
    `);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});