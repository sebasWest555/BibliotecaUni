/* ══════════════════════════════════════════════════════
    server.js — Servidor Principal Express
    Biblioteca Universitaria · Donda Academy Library
    Unidad 5 — Cómputo en la Nube (Azure App Service)
══════════════════════════════════════════════════════ */

const express = require('express');
const session = require('express-session');
const cors    = require('cors');
const path    = require('path');
require('dotenv').config();

const app = express();

// Azure App Service trabaja detrás de un proxy reverso (IIS / nginx).
// Sin esto, las cookies "secure" no se guardan.
app.set('trust proxy', 1);

// ── DETECTAR ENTORNO ─────────────────────────────────
const enAzure = !!process.env.WEBSITE_SITE_NAME; // variable inyectada por App Service
const PORT    = process.env.PORT || 3443;

// ── MIDDLEWARES ──────────────────────────────────────
app.use(cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos del frontend
app.use(express.static(path.join(__dirname, '../frontend')));
app.use('/html', express.static(path.join(__dirname, '../frontend/html')));

// Sesiones del navegador
app.use(session({
    secret: process.env.SESSION_SECRET || 'biblioteca-secret-dev',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: enAzure,        // true en Azure (HTTPS), false en local con HTTP
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 1000 * 60 * 60 * 8
    }
}));

// ── RUTAS ────────────────────────────────────────────
app.use('/api/libros',    require('./routes/libros'));
app.use('/api/usuarios',  require('./routes/usuarios'));
app.use('/api/prestamos', require('./routes/prestamos'));
app.use('/api/cubiculos', require('./routes/cubiculos'));

// Ruta de prueba
app.get('/', (req, res) => {
    res.json({
        mensaje: '✅ Servidor Biblioteca Donda corriendo',
        entorno: enAzure ? 'Azure App Service' : 'Local',
        version: '1.0.0'
    });
});

// ── INICIAR SERVIDOR ─────────────────────────────────
if (enAzure) {
    // En Azure: HTTP plano, Azure pone el HTTPS por fuera
    app.listen(PORT, () => {
        console.log(`☁️  Azure App Service escuchando en puerto ${PORT}`);
    });
} else {
    // En local: HTTPS con tus certificados autofirmados
    const https = require('https');
    const http  = require('http');
    const fs    = require('fs');

    const sslOpciones = {
        key:  fs.readFileSync(path.join(__dirname, 'certs/key.pem')),
        cert: fs.readFileSync(path.join(__dirname, 'certs/cert.pem'))
    };

    const PORT_HTTP  = 3000;
    const PORT_HTTPS = 3443;

    http.createServer((req, res) => {
        res.writeHead(301, { Location: `https://localhost:${PORT_HTTPS}${req.url}` });
        res.end();
    }).listen(PORT_HTTP, () => {
        console.log(`🔀 HTTP  → redirige a https://localhost:${PORT_HTTPS}`);
    });

    https.createServer(sslOpciones, app).listen(PORT_HTTPS, () => {
        console.log(`🔒 HTTPS → https://localhost:${PORT_HTTPS}`);
    });
}
