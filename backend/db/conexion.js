/* ══════════════════════════════════════════════════════
    db/conexion.js — Clase de Conexión a PostgreSQL
    Biblioteca Universitaria · Donda Academy Library
    Soporta local y Azure Database for PostgreSQL
══════════════════════════════════════════════════════ */

require('dotenv').config();
const { Pool } = require('pg');

const enAzure = !!process.env.WEBSITE_SITE_NAME;

class ConexionDB {
    constructor() {
        // En Azure usamos una sola variable DATABASE_URL (más fácil)
        // En local seguimos con las variables separadas
        const config = process.env.DATABASE_URL
            ? {
                connectionString: process.env.DATABASE_URL,
                ssl: { rejectUnauthorized: false } // Azure requiere SSL
              }
            : {
                host:     process.env.DB_HOST,
                port:     process.env.DB_PORT,
                database: process.env.DB_NAME,
                user:     process.env.DB_USER,
                password: process.env.DB_PASSWORD,
                ssl: enAzure ? { rejectUnauthorized: false } : false
              };

        this.pool = new Pool(config);

        this.pool.connect((err, client, release) => {
            if (err) {
                console.error('❌ Error conectando a PostgreSQL:', err.message);
            } else {
                console.log('✅ Conexión a PostgreSQL exitosa');
                release();
            }
        });
    }

    async query(sql, params) {
        try {
            const resultado = await this.pool.query(sql, params);
            return resultado;
        } catch (err) {
            console.error('❌ Error en consulta:', err.message);
            throw err;
        }
    }
}

module.exports = new ConexionDB();
