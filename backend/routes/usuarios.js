/* ══════════════════════════════════════════════════════
    routes/usuarios.js — Gestión de Usuarios
    Paso 2 — Roles, permisos y contraseñas cifradas
══════════════════════════════════════════════════════ */

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db/conexion');
require('dotenv').config();

// ── GET /api/usuarios — Listar usuarios (solo admin)
router.get('/', async (req, res) => {
    try {
        const resultado = await db.query(
            'SELECT id, nombre, email, rol, matricula, activo, creado_en FROM usuarios ORDER BY id'
        );
        res.json({ ok: true, usuarios: resultado.rows });
    } catch (err) {
        res.status(500).json({ ok: false, mensaje: err.message });
    }
});

// ── POST /api/usuarios/registro — Registrar nuevo usuario
router.post('/registro', async (req, res) => {
    try {
        const { nombre, email, password, rol, matricula } = req.body;

        // Validaciones
        if (!nombre || !email || !password) {
            return res.status(400).json({
                ok: false,
                mensaje: 'Nombre, email y contraseña son obligatorios'
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                ok: false,
                mensaje: 'La contraseña debe tener al menos 6 caracteres'
            });
        }

        // Cifrar contraseña con bcrypt — Paso 2
        const salt = await bcrypt.genSalt(10);
        const passwordCifrada = await bcrypt.hash(password, salt);

        // Rol por defecto: alumno
        const rolFinal = rol || 'alumno';

        const resultado = await db.query(
            `INSERT INTO usuarios (nombre, email, password, rol, matricula)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, nombre, email, rol, matricula`,
            [nombre, email, passwordCifrada, rolFinal, matricula || null]
        );

        res.status(201).json({
            ok: true,
            mensaje: 'Usuario registrado correctamente',
            usuario: resultado.rows[0]
        });

    } catch (err) {
        if (err.code === '23505') {
            return res.status(400).json({ ok: false, mensaje: 'El email o matrícula ya existe' });
        }
        res.status(500).json({ ok: false, mensaje: err.message });
    }
});

// ── POST /api/usuarios/login — Iniciar sesión
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                ok: false,
                mensaje: 'Email y contraseña son obligatorios'
            });
        }

        // Buscar usuario
        const resultado = await db.query(
            'SELECT * FROM usuarios WHERE email = $1 AND activo = true',
            [email]
        );

        if (resultado.rows.length === 0) {
            return res.status(401).json({ ok: false, mensaje: 'Credenciales incorrectas' });
        }

        const usuario = resultado.rows[0];

        // Verificar contraseña cifrada
        const passwordValida = await bcrypt.compare(password, usuario.password);
        if (!passwordValida) {
            return res.status(401).json({ ok: false, mensaje: 'Credenciales incorrectas' });
        }

        // Crear token JWT — conservar sesión (Paso 3)
        const token = jwt.sign(
            { id: usuario.id, email: usuario.email, rol: usuario.rol },
            process.env.JWT_SECRET,
            { expiresIn: '8h' }
        );

        // Guardar en sesión del navegador (Paso 3)
        req.session.usuario = {
            id: usuario.id,
            nombre: usuario.nombre,
            email: usuario.email,
            rol: usuario.rol,
            matricula: usuario.matricula
        };

        res.json({
            ok: true,
            mensaje: `Bienvenido ${usuario.nombre}`,
            token,
            usuario: {
                id: usuario.id,
                nombre: usuario.nombre,
                email: usuario.email,
                rol: usuario.rol,
                matricula: usuario.matricula
            }
        });

    } catch (err) {
        res.status(500).json({ ok: false, mensaje: err.message });
    }
});

// ── POST /api/usuarios/logout — Cerrar sesión
router.post('/logout', (req, res) => {
    req.session.destroy();
    res.json({ ok: true, mensaje: 'Sesión cerrada' });
});

// ── GET /api/usuarios/sesion — Verificar sesión activa
router.get('/sesion', (req, res) => {
    if (req.session.usuario) {
        res.json({ ok: true, usuario: req.session.usuario });
    } else {
        res.json({ ok: false, mensaje: 'No hay sesión activa' });
    }
});

// ── PUT /api/usuarios/:id — Modificar usuario
router.put('/:id', async (req, res) => {
    try {
        const { nombre, email, rol, activo } = req.body;

        const resultado = await db.query(
            `UPDATE usuarios SET nombre=$1, email=$2, rol=$3, activo=$4
            WHERE id=$5 RETURNING id, nombre, email, rol, activo`,
            [nombre, email, rol, activo, req.params.id]
        );

        if (resultado.rows.length === 0) {
            return res.status(404).json({ ok: false, mensaje: 'Usuario no encontrado' });
        }

        res.json({ ok: true, usuario: resultado.rows[0] });

    } catch (err) {
        res.status(500).json({ ok: false, mensaje: err.message });
    }
});

// ── DELETE /api/usuarios/:id — Eliminar usuario
router.delete('/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM usuarios WHERE id=$1', [req.params.id]);
        res.json({ ok: true, mensaje: 'Usuario eliminado' });
    } catch (err) {
        res.status(500).json({ ok: false, mensaje: err.message });
    }
});

module.exports = router;