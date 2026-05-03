/* ══════════════════════════════════════════════════════
    routes/prestamos.js — Préstamos y Devoluciones
    Unidad 4 — Programación del Lado del Servidor
══════════════════════════════════════════════════════ */

const express = require('express');
const router  = express.Router();
const db      = require('../db/conexion');

// ── GET /api/prestamos — Listar todos los préstamos
router.get('/', async (req, res) => {
    try {
        const resultado = await db.query(`
            SELECT p.id, p.estado, p.fecha_salida, p.fecha_limite, p.fecha_devolucion,
                    l.titulo, l.isbn, l.autor,
                    u.nombre AS alumno, u.matricula
            FROM prestamos p
            JOIN libros   l ON p.libro_id   = l.id
            JOIN usuarios u ON p.usuario_id = u.id
            ORDER BY p.fecha_salida DESC
        `);
        res.json({ ok: true, prestamos: resultado.rows });
    } catch (err) {
        res.status(500).json({ ok: false, mensaje: err.message });
    }
});

// ── POST /api/prestamos — Registrar préstamo
router.post('/', async (req, res) => {
    try {
        const { isbn, matricula } = req.body;

        if (!isbn || !matricula) {
            return res.status(400).json({ 
                ok: false, 
                mensaje: 'ISBN y matrícula son obligatorios' 
            });
        }

        // Buscar libro
        const libro = await db.query(
            'SELECT * FROM libros WHERE isbn = $1', [isbn]
        );
        if (libro.rows.length === 0) {
            return res.status(404).json({ ok: false, mensaje: 'Libro no encontrado' });
        }
        if (libro.rows[0].copias === 0) {
            return res.status(400).json({ ok: false, mensaje: 'No hay copias disponibles' });
        }

        // Buscar usuario
        const usuario = await db.query(
            'SELECT * FROM usuarios WHERE matricula = $1 AND activo = true', [matricula]
        );
        if (usuario.rows.length === 0) {
            return res.status(404).json({ ok: false, mensaje: 'Alumno no encontrado' });
        }

        // Verificar sanciones activas — RF-05
        const sancion = await db.query(
            'SELECT * FROM sanciones WHERE usuario_id = $1 AND activa = true',
            [usuario.rows[0].id]
        );
        if (sancion.rows.length > 0) {
            return res.status(403).json({ 
                ok: false, 
                mensaje: 'El alumno tiene sanciones activas, no puede realizar préstamos' 
            });
        }

        // Registrar préstamo
        const fechaLimite = new Date();
        fechaLimite.setDate(fechaLimite.getDate() + 7); // 7 días

        const prestamo = await db.query(
            `INSERT INTO prestamos (libro_id, usuario_id, fecha_limite)
             VALUES ($1, $2, $3) RETURNING *`,
            [libro.rows[0].id, usuario.rows[0].id, fechaLimite]
        );

        // Descontar copia
        await db.query(
            'UPDATE libros SET copias = copias - 1 WHERE id = $1',
            [libro.rows[0].id]
        );

        res.status(201).json({ 
            ok: true, 
            mensaje: `Préstamo registrado. Fecha límite: ${fechaLimite.toLocaleDateString('es-MX')}`,
            prestamo: prestamo.rows[0]
        });

    } catch (err) {
        res.status(500).json({ ok: false, mensaje: err.message });
    }
});

// ── PUT /api/prestamos/:id/devolver — Registrar devolución
router.put('/:id/devolver', async (req, res) => {
    try {
        const prestamo = await db.query(
            'SELECT * FROM prestamos WHERE id = $1', [req.params.id]
        );

        if (prestamo.rows.length === 0) {
            return res.status(404).json({ ok: false, mensaje: 'Préstamo no encontrado' });
        }

        if (prestamo.rows[0].estado === 'devuelto') {
            return res.status(400).json({ ok: false, mensaje: 'Este préstamo ya fue devuelto' });
        }

        const ahora       = new Date();
        const fechaLimite = new Date(prestamo.rows[0].fecha_limite);
        const esTarde     = ahora > fechaLimite;

        // Actualizar préstamo
        await db.query(
            `UPDATE prestamos 
            SET fecha_devolucion = NOW(), estado = $1
            WHERE id = $2`,
            [esTarde ? 'sancionado' : 'devuelto', req.params.id]
        );

        // Regresar copia al inventario
        await db.query(
            'UPDATE libros SET copias = copias + 1 WHERE id = $1',
            [prestamo.rows[0].libro_id]
        );

        // Si llegó tarde, crear sanción automática — RF-08
        if (esTarde) {
            await db.query(
                `INSERT INTO sanciones (usuario_id, prestamo_id, motivo)
                VALUES ($1, $2, $3)`,
                [prestamo.rows[0].usuario_id, req.params.id, 'Devolución tardía']
            );
        }

        res.json({ 
            ok: true, 
            mensaje: esTarde 
                ? '⚠️ Devolución registrada con retraso. Se aplicó sanción.' 
                : '✅ Devolución registrada correctamente.',
            sancionado: esTarde
        });

    } catch (err) {
        res.status(500).json({ ok: false, mensaje: err.message });
    }
});

// ── GET /api/prestamos/activos — Préstamos activos
router.get('/activos', async (req, res) => {
    try {
        const resultado = await db.query(`
            SELECT p.id, p.fecha_salida, p.fecha_limite,
                    l.titulo, l.isbn,
                    u.nombre AS alumno, u.matricula,
                    CASE WHEN NOW() > p.fecha_limite THEN true ELSE false END AS vencido
            FROM prestamos p
            JOIN libros   l ON p.libro_id   = l.id
            JOIN usuarios u ON p.usuario_id = u.id
            WHERE p.estado = 'activo'
            ORDER BY p.fecha_limite ASC
        `);
        res.json({ ok: true, prestamos: resultado.rows });
    } catch (err) {
        res.status(500).json({ ok: false, mensaje: err.message });
    }
});

module.exports = router;