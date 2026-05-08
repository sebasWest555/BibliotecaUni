const db = require('./db/conexion');

async function testInsert() {
    try {
        const titulo = "Libro Test";
        const autor = "Autor Test";
        const isbn = "1234567890";
        const editorial = "Editorial Test";
        const anio = "2023";
        const genero = "Ficción";
        const copias = "2";
        const descripcion = "Test desc";

        const resultado = await db.query(
            `INSERT INTO libros (titulo, autor, isbn, editorial, anio, genero, copias, descripcion)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             RETURNING *`,
            [titulo, autor, isbn, editorial, anio || null, genero, copias || 1, descripcion]
        );
        console.log("Insert success:", resultado.rows[0]);
    } catch(e) {
        console.error("Insert error:", e);
    } finally {
        process.exit(0);
    }
}

testInsert();
