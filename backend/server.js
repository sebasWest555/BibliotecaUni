/* ══════════════════════════════════════════════════════
    server.js — Servidor Principal Express
    Biblioteca Universitaria · Donda Academy Library
    Unidad 4 — Programación del Lado del Servidor
══════════════════════════════════════════════════════ */

const express    = require('express');
const session    = require('express-session');
const cors       = require('cors');
require('dotenv').config();

const path = require('path');

const app = express();

// ── MIDDLEWARES ──────────────────────────────────────
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos del frontend
app.use(express.static(path.join(__dirname, '../frontend')));
app.use('/html', express.static(path.join(__dirname, '../frontend/html')));

// Sesiones del navegador — Paso 3 de la práctica
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: false,   // true cuando tengamos HTTPS
        maxAge: 1000 * 60 * 60 * 8  // 8 horas
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
        version: '1.0.0',
        endpoints: [
            'GET  /api/libros',
            'POST /api/libros',
            'GET  /api/usuarios',
            'POST /api/usuarios/login',
            'GET  /api/prestamos',
            'POST /api/prestamos',
            'GET  /api/cubiculos',
            'POST /api/cubiculos/reservar'
        ]
    });
});

// ── INICIAR SERVIDOR ─────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});

/* 
server.js - servidor principal express

Biblioteca Universitaria · Donda Academy Library

Unidad 4 — Programación del Lado del Servidor


const express = require('express');
const session = require('express-session');
const cors = require('cors');
const { version } = require('react');
require('dotenv').config();

const app = express();

// MIDLEWARES

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//sesiones del navegador 

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false,
        maxAge: 1000 * 60 * 60 * 8
    }
}));

//rutas

app.use('/api/libros', require('./routes/libros'));
app.use('/api/usuarios', require('./routes/usuarios'));
app.use('/api/prestamos', require('./routes/prestamos'));
app.use('/api/cubiculos', require('./routes/cubiculos'));

//ruta de prueba
app.get('/', (req, res) => {
    res.json()({
        mensaje: 'servidor corriendo',
        version: '1.0.0',
        endpoints: [
            'GET /api/libros',
            'POST /api/libros',
            'GET /api/usuarios',
            'POST /api/usuarios/login',
            'GET /api/prestamos',
            'POST /api/prestamos',
            'GET /api/cubiculos',
            'POST /api/cubiculos/reservar'
        ]

    });

});

//iniciar servidor

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`servidor corriendo va, en http://localhost:${PORT}`);
});
*/
