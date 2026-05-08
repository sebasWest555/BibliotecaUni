const db = require('./db/conexion');

async function test() {
    try {
        const res1 = await db.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'libros'");
        console.log("Tabla libros:", res1.rows);
        
        const res2 = await db.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'cubiculos'");
        console.log("Tabla cubiculos:", res2.rows);

        process.exit(0);
    } catch(e) {
        console.error(e);
        process.exit(1);
    }
}

test();
