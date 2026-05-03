const bcrypt = require('bcryptjs');
const db = require('./db/conexion');
require('dotenv').config();

async function seed() {
    try {
        // Cifrar contraseña
        const salt = await bcrypt.genSalt(10);
        const password = await bcrypt.hash('admin123', salt);

        // Insertar admin
        await db.query(
            `INSERT INTO usuarios (nombre, email, password, rol, matricula)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (email) DO UPDATE SET password = $3`,
            ['Administrador', 'admin@biblioteca.edu', password, 'admin', 'ADMIN001']
        );

        console.log('✅ Admin creado — email: admin@biblioteca.edu | password: admin123');

        // Insertar alumno de prueba
        const passAlumno = await bcrypt.hash('alumno123', salt);
        await db.query(
            `INSERT INTO usuarios (nombre, email, password, rol, matricula)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (email) DO NOTHING`,
            ['Juan Pérez', 'juan@estudiante.edu', passAlumno, 'alumno', 'L23121064']
        );

        console.log('✅ Alumno de prueba creado — email: juan@estudiante.edu | password: alumno123');
        process.exit(0);

    } catch (err) {
        console.error('❌ Error:', err.message);
        process.exit(1);
    }
}

seed();