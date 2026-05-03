/* ══════════════════════════════════════════════════════
    routes/cubiculos.js — Gestión de Cubículos
    Unidad 4 — Programación del Lado del Servidor
══════════════════════════════════════════════════════ */

const express = require('express');
const router  = express.Router();
const db      = require('../db/conexion');

// ── GET /api/cubiculos — Estado de todos los cubículos
router.get('/', async (req, res) => {
    try {
        const resultado = await db.query(`
            SELECT c.*,
                    r.id AS reserva_id,
                    r.inicio, r.fin, r.estado AS estado_reserva,
                    u.nombre AS ocupante, u.matricula
            FROM cubiculos c
            LEFT JOIN reservas_cubiculos r 
                ON c.id = r.cubiculo_id AND r.estado = 'activa' AND r.fin > NOW()
            LEFT JOIN usuarios u ON r.usuario_id = u.id
            ORDER BY c.id
        `);
        res.json({ ok: true, cubiculos: resultado.rows });
    } catch (err) {
        res.status(500).json({ ok: false, mensaje: err.message });
    }
});

// ── POST /api/cubiculos/reservar — Hacer reserva
router.post('/reservar', async (req, res) => {
    try {
        const { cubiculo_id, matricula, duracion_minutos } = req.body;

        if (!cubiculo_id || !matricula || !duracion_minutos) {
            return res.status(400).json({ 
                ok: false, 
                mensaje: 'Cubículo, matrícula y duración son obligatorios' 
            });
        }

        // Buscar usuario
        const usuario = await db.query(
            'SELECT * FROM usuarios WHERE matricula = $1 AND activo = true', [matricula]
        );
        if (usuario.rows.length === 0) {
            return res.status(404).json({ ok: false, mensaje: 'Alumno no encontrado' });
        }

        // Verificar disponibilidad
        const ocupado = await db.query(`
            SELECT * FROM reservas_cubiculos 
            WHERE cubiculo_id = $1 AND estado = 'activa' AND fin > NOW()
        `, [cubiculo_id]);

        if (ocupado.rows.length > 0) {
            return res.status(400).json({ ok: false, mensaje: 'El cubículo no está disponible' });
        }

        // Crear reserva
        const inicio = new Date();
        const fin    = new Date(inicio.getTime() + duracion_minutos * 60000);

        const reserva = await db.query(
            `INSERT INTO reservas_cubiculos (cubiculo_id, usuario_id, inicio, fin)
             VALUES ($1, $2, $3, $4) RETURNING *`,
            [cubiculo_id, usuario.rows[0].id, inicio, fin]
        );

        res.status(201).json({ 
            ok: true, 
            mensaje: 'Cubículo reservado correctamente',
            reserva: reserva.rows[0]
        });

    } catch (err) {
        res.status(500).json({ ok: false, mensaje: err.message });
    }
});

// ── PUT /api/cubiculos/liberar/:id — Liberar cubículo
router.put('/liberar/:id', async (req, res) => {
    try {
        await db.query(
            `UPDATE reservas_cubiculos SET estado = 'cancelada'
            WHERE cubiculo_id = $1 AND estado = 'activa'`,
            [req.params.id]
        );
        res.json({ ok: true, mensaje: 'Cubículo liberado correctamente' });
    } catch (err) {
        res.status(500).json({ ok: false, mensaje: err.message });
    }
});

// ── DELETE /api/cubiculos/reserva/:id — Cancelar reserva — RF-12
router.delete('/reserva/:id', async (req, res) => {
    try {
        const resultado = await db.query(
            `UPDATE reservas_cubiculos SET estado = 'cancelada'
             WHERE id = $1 RETURNING *`,
            [req.params.id]
        );

        if (resultado.rows.length === 0) {
            return res.status(404).json({ ok: false, mensaje: 'Reserva no encontrada' });
        }

        res.json({ ok: true, mensaje: 'Reserva cancelada correctamente' });
    } catch (err) {
        res.status(500).json({ ok: false, mensaje: err.message });
    }
});

module.exports = router;