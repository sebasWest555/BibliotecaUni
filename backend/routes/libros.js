/* ══════════════════════════════════════════════════════
   routes/libros.js — CRUD de Libros
   Unidad 4 — Programación del Lado del Servidor
══════════════════════════════════════════════════════ */

const express = require('express');
const router  = express.Router();
const db      = require('../db/conexion');

// ── GET /api/libros — Obtener todos los libros
router.get('/', async (req, res) => {
    try {
        const { termino } = req.query;

        let sql    = 'SELECT * FROM libros';
        let params = [];

        // AJAX — búsqueda en tiempo real (Paso 3)
        if (termino) {
            sql    = `SELECT * FROM libros 
                      WHERE LOWER(titulo)    LIKE $1 
                         OR LOWER(autor)     LIKE $1 
                         OR LOWER(isbn)      LIKE $1
                         OR LOWER(genero)    LIKE $1`;
            params = [`%${termino.toLowerCase()}%`];
        }

        sql += ' ORDER BY titulo ASC';

        const resultado = await db.query(sql, params);
        res.json({ ok: true, libros: resultado.rows });

    } catch (err) {
        res.status(500).json({ ok: false, mensaje: err.message });
    }
});

// ── GET /api/libros/:id — Obtener un libro por ID
router.get('/:id', async (req, res) => {
    try {
        const resultado = await db.query(
            'SELECT * FROM libros WHERE id = $1',
            [req.params.id]
        );

        if (resultado.rows.length === 0) {
            return res.status(404).json({ ok: false, mensaje: 'Libro no encontrado' });
        }

        res.json({ ok: true, libro: resultado.rows[0] });

    } catch (err) {
        res.status(500).json({ ok: false, mensaje: err.message });
    }
});

// ── POST /api/libros — Agregar nuevo libro (Alta)
router.post('/', async (req, res) => {
    try {
        const { titulo, autor, isbn, editorial, anio, genero, copias, descripcion } = req.body;

        // Validaciones del lado del servidor
        if (!titulo || !autor || !isbn) {
            return res.status(400).json({ 
                ok: false, 
                mensaje: 'Título, autor e ISBN son obligatorios' 
            });
        }

        if (!/^\d{10}$|^\d{13}$/.test(isbn)) {
            return res.status(400).json({ 
                ok: false, 
                mensaje: 'El ISBN debe tener 10 o 13 dígitos' 
            });
        }

        const resultado = await db.query(
            `INSERT INTO libros (titulo, autor, isbn, editorial, anio, genero, copias, descripcion)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             RETURNING *`,
            [titulo, autor, isbn, editorial, anio || null, genero, copias || 1, descripcion]
        );

        res.status(201).json({ ok: true, libro: resultado.rows[0] });

    } catch (err) {
        // ISBN duplicado
        if (err.code === '23505') {
            return res.status(400).json({ ok: false, mensaje: 'Ya existe un libro con ese ISBN' });
        }
        res.status(500).json({ ok: false, mensaje: err.message });
    }
});

// ── PUT /api/libros/:id — Modificar libro
router.put('/:id', async (req, res) => {
    try {
        const { titulo, autor, isbn, editorial, anio, genero, copias, descripcion } = req.body;

        const resultado = await db.query(
            `UPDATE libros 
             SET titulo=$1, autor=$2, isbn=$3, editorial=$4, 
                 anio=$5, genero=$6, copias=$7, descripcion=$8
             WHERE id=$9
             RETURNING *`,
            [titulo, autor, isbn, editorial, anio, genero, copias, descripcion, req.params.id]
        );

        if (resultado.rows.length === 0) {
            return res.status(404).json({ ok: false, mensaje: 'Libro no encontrado' });
        }

        res.json({ ok: true, libro: resultado.rows[0] });

    } catch (err) {
        res.status(500).json({ ok: false, mensaje: err.message });
    }
});

// ── DELETE /api/libros/:id — Eliminar libro
router.delete('/:id', async (req, res) => {
    try {
        const resultado = await db.query(
            'DELETE FROM libros WHERE id=$1 RETURNING *',
            [req.params.id]
        );

        if (resultado.rows.length === 0) {
            return res.status(404).json({ ok: false, mensaje: 'Libro no encontrado' });
        }

        res.json({ ok: true, mensaje: 'Libro eliminado correctamente' });

    } catch (err) {
        res.status(500).json({ ok: false, mensaje: err.message });
    }
});

module.exports = router;