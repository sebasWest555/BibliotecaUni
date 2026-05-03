

/* ══════════════════════════════════════════════════════
    db/conexion.js — Clase de Conexión a PostgreSQL
    Biblioteca Universitaria · Donda Academy Library
    Unidad 4 — Programación del Lado del Servidor
══════════════════════════════════════════════════════ */

require('dotenv').config();
const { Pool } = require('pg');

// Clase de conexión — cumple Paso 1 de la práctica
class ConexionDB {
    constructor() {
        this.pool = new Pool({
            host:     process.env.DB_HOST,
            port:     process.env.DB_PORT,
            database: process.env.DB_NAME,
            user:     process.env.DB_USER,
            password: process.env.DB_PASSWORD,
        });

        // Verificar conexión al iniciar
        this.pool.connect((err, client, release) => {
            if (err) {
                console.error('❌ Error conectando a PostgreSQL:', err.message);
            } else {
                console.log('✅ Conexión a PostgreSQL exitosa —', process.env.DB_NAME);
                release();
            }
        });
    }

    // Método para ejecutar consultas
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

// Exportar una sola instancia (patrón Singleton)
module.exports = new ConexionDB();

/*
db/connexion.js - clase de conexion a la base de datos en postgres

DONDA library SEBAS ₩€$₺ CORPORATION

unidad 4 - programacion del lado del cliente 

const { pool, Pool, Client } = require('pg');
require('dotenv').config();

//connection class - step 1

class ConexionDB {
    constructor() {
        this.pool = new Pool({
            host: process.env.DB_HOST,
            port: process.env.DB_PORT,
            database: process.env.DB_NAME,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD
        });

        //chseck connection

        this.pool.connect((err, client, relase) => {
            if (err) {
                console.log('error cinectando postgres: ', err.message);
            } else {
                console.log('conectado correctamente', process.env.DB_NAME);
                relase();
            }
        });
    }

    async query(sql, params){
        try {
            const resultado = await this.pool.query(sql,params);
            return resultado;
        } catch (err) {
            console.error('error enn consulta', err.message);
            throw err;
        }
    }

}

//exportar una sola innnstancia para el SINGLETOWN

module.exports = new ConexionDB();
*/

