/* ══════════════════════════════════════════════════════
   biblioteca.js — Objetos, Constructores y Lógica Principal
   Biblioteca Universitaria · SEBAS WEST CORPORATION
   Unidad 3 — Programación del Lado del Cliente
══════════════════════════════════════════════════════ */

/* ─────────────────────────────────────────
   PASO 3 — Constructor de Libro
   Define la estructura de un objeto Libro
───────────────────────────────────────── */
function Libro(titulo, autor, isbn, editorial, anio, genero, copias, descripcion) {
    this.titulo      = titulo;
    this.autor       = autor;
    this.isbn        = isbn;
    this.editorial   = editorial;
    this.anio        = anio;
    this.genero      = genero;
    this.copias      = copias;
    this.descripcion = descripcion;
}

/* ─────────────────────────────────────────
   Array de libros de ejemplo (mínimo 5)
   En producción estos vendrían de la BD
───────────────────────────────────────── */
const catalogoLibros = [
    new Libro(
        "Cálculo de Una Variable",
        "James Stewart",
        "9780538497817",
        "Cengage Learning",
        2012,
        "Matemáticas",
        3,
        "Introducción al cálculo diferencial e integral de una variable con aplicaciones."
    ),
    new Libro(
        "Ingeniería de Software: Un Enfoque Práctico",
        "Roger S. Pressman",
        "9786071503145",
        "McGraw-Hill",
        2010,
        "Ingeniería",
        2,
        "Fundamentos del proceso de software, modelado y gestión de proyectos."
    ),
    new Libro(
        "Física Universitaria Vol. 1",
        "Sears y Zemansky",
        "9786073215237",
        "Pearson",
        2013,
        "Física",
        0,
        "Mecánica, oscilaciones, ondas y termodinámica para estudiantes universitarios."
    ),
    new Libro(
        "Estructuras de Datos y Algoritmos en Java",
        "Michael T. Goodrich",
        "9780470383267",
        "Wiley",
        2010,
        "Programación",
        5,
        "Diseño e implementación de estructuras de datos fundamentales usando Java."
    ),
    new Libro(
        "El Arte de Programar Computadoras",
        "Donald E. Knuth",
        "9780201896831",
        "Addison-Wesley",
        1997,
        "Programación",
        1,
        "Obra clásica sobre algoritmos fundamentales y análisis de complejidad."
    ),
    new Libro(
        "Base de Datos",
        "Abraham Silberschatz",
        "9788448190330",
        "McGraw-Hill",
        2014,
        "Bases de Datos",
        4,
        "Conceptos fundamentales de sistemas de bases de datos relacionales y no relacionales."
    ),
    new Libro(
        "Redes de Computadoras",
        "Andrew S. Tanenbaum",
        "9789702605855",
        "Pearson",
        2012,
        "Redes",
        0,
        "Principios y protocolos de redes de computadoras desde la capa física hasta la aplicación."
    ),
];

/* ─────────────────────────────────────────
   RENDERIZADO DE LIBROS EN PRÉSTAMOS
   Usa jQuery .append() y condicionales
   if/else para el botón PRESTAR/BLOQUEADO
───────────────────────────────────────── */

/**
 * Genera el HTML de una tarjeta de libro.
 * @param {Libro} libro
 * @returns {string} HTML del elemento
 */
function crearTarjetaLibro(libro) {
    // if/else: botón verde si hay copias, rojo si no
    const boton = libro.copias > 0
        ? `<button class="btn btn-green btn-prestar" data-isbn="${libro.isbn}">PRESTAR</button>`
        : `<button class="btn btn-red" disabled>BLOQUEADO</button>`;

    return `
        <div class="book-item" data-isbn="${libro.isbn}">
            <div class="book-info">
                <h3>${libro.titulo}</h3>
                <p>Autor: ${libro.autor} &nbsp;|&nbsp; ISBN: ${libro.isbn}</p>
                <p>Editorial: ${libro.editorial} &nbsp;|&nbsp; Año: ${libro.anio} &nbsp;|&nbsp; Copias disponibles: <strong>${libro.copias}</strong></p>
            </div>
            <div class="book-actions">
                ${boton}
            </div>
        </div>
    `;
}

/**
 * Renderiza un array de libros en el contenedor #bookList.
 * @param {Libro[]} libros
 */
function renderizarLibros(libros) {
    const $lista = $("#bookList");
    $lista.empty(); // limpiar antes de renderizar

    if (libros.length === 0) {
        $lista.html('<p class="sin-resultados">No se encontraron libros.</p>');
        return;
    }

    // Bucle for para recorrer el array
    for (let i = 0; i < libros.length; i++) {
        const html = crearTarjetaLibro(libros[i]);
        $lista.append($(html).hide().fadeIn(300 + i * 80)); // fadeIn escalonado
    }
}

/* ─────────────────────────────────────────
   BÚSQUEDA EN TIEMPO REAL
   Filtra el array con .filter() y
   actualiza la lista sin recargar
───────────────────────────────────────── */

/**
 * Filtra el catálogo por término de búsqueda.
 * Busca en título, autor e ISBN.
 * @param {string} termino
 * @returns {Libro[]}
 */
function buscarLibros(termino) {
    const t = termino.toLowerCase().trim();
    if (t === "") return catalogoLibros;

    return catalogoLibros.filter(libro =>
        libro.titulo.toLowerCase().includes(t) ||
        libro.autor.toLowerCase().includes(t)  ||
        libro.isbn.includes(t)                 ||
        libro.genero.toLowerCase().includes(t)
    );
}

/* ─────────────────────────────────────────
   MODAL DE PRÉSTAMO
   Muestra un formulario dinámico para
   registrar el préstamo sin recargar
───────────────────────────────────────── */

/**
 * Abre el modal de préstamo para un libro.
 * @param {string} isbn
 */
function abrirModalPrestamo(isbn) {
    const libro = catalogoLibros.find(l => l.isbn === isbn);
    if (!libro) return;

    $("#modalPrestamoTitulo").text(libro.titulo);
    $("#modalPrestamoISBN").val(libro.isbn);
    $("#modalPrestamo").fadeIn(200);
}

/**
 * Cierra el modal de préstamo.
 */
function cerrarModalPrestamo() {
    $("#modalPrestamo").fadeOut(200);
    $("#formPrestamo")[0].reset();
    $(".modal-field-error").text("");
}

/**
 * Confirma el préstamo y actualiza las copias.
 * @param {string} isbn
 * @param {string} matricula
 */
function confirmarPrestamo(isbn, matricula) {
    const libro = catalogoLibros.find(l => l.isbn === isbn);
    if (!libro || libro.copias === 0) return;

    libro.copias--;

    cerrarModalPrestamo();

    // Mensaje de éxito con fadeIn/fadeOut
    $("#mensajeExito")
        .text(`¡Préstamo registrado! "${libro.titulo}" — Mat. ${matricula}`)
        .fadeIn(300)
        .delay(3500)
        .fadeOut(400);

    // Re-renderizar con los datos actualizados
    const terminoActual = $("#inputBuscar").val();
    renderizarLibros(buscarLibros(terminoActual));
}

/* ─────────────────────────────────────────
   INICIO — jQuery document ready
───────────────────────────────────────── */
$(function () {

    /* ── Búsqueda en tiempo real (index + préstamos) ── */
    $("#inputBuscar, #inputBuscarPrestamos").on("input", function () {
        const termino   = $(this).val();
        const resultados = buscarLibros(termino);

        // Contador de resultados
        $("#contadorResultados").text(
            termino.trim() === ""
                ? `${catalogoLibros.length} libros en catálogo`
                : `${resultados.length} resultado(s) encontrado(s)`
        );

        renderizarLibros(resultados);
    });

    /* ── Botón BUSCAR (index) — también filtra ── */
    $("#btnBuscar").on("click", function () {
        const termino    = $("#inputBuscar").val();
        const resultados = buscarLibros(termino);
        renderizarLibros(resultados);

        // Efecto en el botón
        $(this).addClass("btn-clicked");
        setTimeout(() => $(this).removeClass("btn-clicked"), 300);
    });

    /* ── Botón PRESTAR — abre modal ── */
    $(document).on("click", ".btn-prestar", function () {
        const isbn = $(this).data("isbn");
        abrirModalPrestamo(isbn);
    });

    /* ── Confirmar dentro del modal de préstamo ── */
    $("#btnConfirmarPrestamo").on("click", function () {
        const isbn      = $("#modalPrestamoISBN").val();
        const matricula = $("#inputMatriculaPrestamo").val().trim();

        if (!matricula) {
            $("#errorMatriculaPrestamo").text("La matrícula es obligatoria.");
            return;
        }

        $("#errorMatriculaPrestamo").text("");
        confirmarPrestamo(isbn, matricula);
    });

    /* ── Cerrar modal de préstamo ── */
    $("#btnCerrarModalPrestamo, #modalPrestamo").on("click", function (e) {
        if (e.target === this) cerrarModalPrestamo();
    });

    /* ── Hover animado en botones .btn ── */
    $(document).on("mouseenter", ".btn", function () {
        $(this).stop(true).animate({ opacity: 0.85 }, 120);
    }).on("mouseleave", ".btn", function () {
        $(this).stop(true).animate({ opacity: 1 }, 120);
    });

    /* ── Renderizado inicial si existe el contenedor ── */
    if ($("#bookList").length) {
        renderizarLibros(catalogoLibros);
        $("#contadorResultados").text(`${catalogoLibros.length} libros en catálogo`);
    }
});
