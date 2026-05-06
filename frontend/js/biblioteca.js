/* ══════════════════════════════════════════════════════
   biblioteca.js — Conexión Frontend → Backend
   Unidad 4 — Programación del Lado del Servidor
   Usa AJAX (jQuery) para consumir la API REST
══════════════════════════════════════════════════════ */


// ── RENDERIZADO DE LIBROS ────────────────────────────
function crearTarjetaLibro(libro) {
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
            <div class="book-actions">${boton}</div>
        </div>
    `;
}

function renderizarLibros(libros) {
    const $lista = $("#bookList").empty();

    if (libros.length === 0) {
        $lista.html('<p class="sin-resultados">No se encontraron libros.</p>');
        return;
    }

    for (let i = 0; i < libros.length; i++) {
        $lista.append($(crearTarjetaLibro(libros[i])).hide().fadeIn(300 + i * 80));
    }
}

// ── CARGAR LIBROS DESDE LA BD (AJAX) ────────────────
function cargarLibros(termino) {
    const url = termino
        ? `${API}/libros?termino=${encodeURIComponent(termino)}`
        : `${API}/libros`;

    $.ajax({
        url:     url,
        method:  'GET',
        success: function(res) {
            if (res.ok) {
                renderizarLibros(res.libros);
                $("#contadorResultados").text(
                    termino
                        ? `${res.libros.length} resultado(s) encontrado(s)`
                        : `${res.libros.length} libros en catálogo`
                );
            }
        },
        error: function(err) {
            console.error('Error cargando libros:', err);
            $("#bookList").html('<p class="sin-resultados">Error conectando al servidor.</p>');
        }
    });
}

// ── MODAL DE PRÉSTAMO ────────────────────────────────
function abrirModalPrestamo(isbn) {
    $.ajax({
        url:     `${API}/libros`,
        method:  'GET',
        success: function(res) {
            const libro = res.libros.find(l => l.isbn === isbn);
            if (!libro) return;
            $("#modalPrestamoTitulo").text(libro.titulo);
            $("#modalPrestamoISBN").val(libro.isbn);
            $("#modalPrestamo").fadeIn(200);
        }
    });
}

function cerrarModalPrestamo() {
    $("#modalPrestamo").fadeOut(200);
    $("#inputMatriculaPrestamo").val('');
    $("#errorMatriculaPrestamo").text('');
}

// ── CONFIRMAR PRÉSTAMO (AJAX → BD) ───────────────────
function confirmarPrestamo(isbn, matricula) {
    $.ajax({
        url:         `${API}/prestamos`,
        method:      'POST',
        contentType: 'application/json',
        data:        JSON.stringify({ isbn, matricula }),
        success: function(res) {
            cerrarModalPrestamo();
            $("#mensajeExito")
                .text(`✅ ${res.mensaje}`)
                .fadeIn(300).delay(4000).fadeOut(400);
            cargarLibros(); // recargar con datos actualizados de BD
        },
        error: function(err) {
            const msg = err.responseJSON ? err.responseJSON.mensaje : 'Error al registrar préstamo';
            $("#errorMatriculaPrestamo").text(msg);
        }
    });
}

// ── GUARDAR LIBRO EN BD (Alta) ───────────────────────
function guardarLibro(datos) {
    $.ajax({
        url:         `${API}/libros`,
        method:      'POST',
        contentType: 'application/json',
        data:        JSON.stringify(datos),
        success: function(res) {
            $("#mensajeFormulario")
                .text('✅ Libro guardado correctamente en la base de datos.')
                .removeClass('msg-error').addClass('msg-exito')
                .slideDown(200).delay(3000).slideUp(300);
        },
        error: function(err) {
            const msg = err.responseJSON ? err.responseJSON.mensaje : 'Error al guardar';
            $("#mensajeFormulario")
                .text('❌ ' + msg)
                .removeClass('msg-exito').addClass('msg-error')
                .slideDown(200);
        }
    });
}

// ── MODIFICAR LIBRO EN BD ────────────────────────────
function modificarLibro(id, datos) {
    $.ajax({
        url:         `${API}/libros/${id}`,
        method:      'PUT',
        contentType: 'application/json',
        data:        JSON.stringify(datos),
        success: function(res) {
            $("#mensajeFormulario")
                .text('✅ Libro actualizado correctamente.')
                .removeClass('msg-error').addClass('msg-exito')
                .slideDown(200).delay(3000).slideUp(300);
        },
        error: function(err) {
            const msg = err.responseJSON ? err.responseJSON.mensaje : 'Error al actualizar';
            $("#mensajeFormulario")
                .text('❌ ' + msg)
                .removeClass('msg-exito').addClass('msg-error')
                .slideDown(200);
        }
    });
}

// ── ELIMINAR LIBRO EN BD ─────────────────────────────
function eliminarLibro(isbn) {
    $.ajax({
        url:    `${API}/libros`,
        method: 'GET',
        success: function(res) {
            const libro = res.libros.find(l => l.isbn === isbn);
            if (!libro) {
                $("#mensajeFormulario")
                    .text('❌ No se encontró un libro con ese ISBN.')
                    .removeClass('msg-exito').addClass('msg-error')
                    .slideDown(200);
                return;
            }

            $.ajax({
                url:    `${API}/libros/${libro.id}`,
                method: 'DELETE',
                success: function() {
                    $("#mensajeFormulario")
                        .text('✅ Libro eliminado correctamente.')
                        .removeClass('msg-error').addClass('msg-exito')
                        .slideDown(200).delay(3000).slideUp(300);
                },
                error: function(err) {
                    const msg = err.responseJSON ? err.responseJSON.mensaje : 'Error al eliminar';
                    $("#mensajeFormulario")
                        .text('❌ ' + msg)
                        .removeClass('msg-exito').addClass('msg-error')
                        .slideDown(200);
                }
            });
        }
    });
}

// ── JQUERY DOCUMENT READY ────────────────────────────
$(function () {

    // Búsqueda en tiempo real — AJAX al backend
    $("#inputBuscar, #inputBuscarPrestamos").on("input", function () {
        cargarLibros($(this).val().trim());
    });

    // Botón BUSCAR
    $("#btnBuscar").on("click", function () {
        cargarLibros($("#inputBuscar").val().trim());
        $(this).addClass("btn-clicked");
        setTimeout(() => $(this).removeClass("btn-clicked"), 300);
    });

    // Botón PRESTAR
    $(document).on("click", ".btn-prestar", function () {
        abrirModalPrestamo($(this).data("isbn"));
    });

    // Confirmar préstamo
    $("#btnConfirmarPrestamo").on("click", function () {
        const isbn      = $("#modalPrestamoISBN").val();
        const matricula = $("#inputMatriculaPrestamo").val().trim();
        if (!matricula) {
            $("#errorMatriculaPrestamo").text("La matrícula es obligatoria.");
            return;
        }
        $("#errorMatriculaPrestamo").text('');
        confirmarPrestamo(isbn, matricula);
    });

    // Cerrar modal préstamo
    $("#btnCerrarModalPrestamo, #modalPrestamo").on("click", function (e) {
        if (e.target === this) cerrarModalPrestamo();
    });

    // Formulario ALTA — guardar en BD
    if ($("#formLibro").length && window.location.href.includes('alta')) {
        $("#formLibro").on("submit", function (e) {
            e.preventDefault();
            const esValido = validarFormularioLibro("formLibro");
            if (esValido) {
                guardarLibro({
                    titulo:      $("#titulo").val(),
                    autor:       $("#autor").val(),
                    isbn:        $("#isbn").val(),
                    editorial:   $("#editorial").val(),
                    anio:        $("#anio").val(),
                    genero:      $("#genero").val(),
                    copias:      $("#copias").val(),
                    descripcion: $("#descripcion").val()
                });
            }
        });
    }

    // Formulario MODIFICAR — buscar y actualizar en BD
    if ($("#btnBuscarISBN").length) {
        $("#btnBuscarISBN").on("click", function () {
            const isbn = $("#isbnBuscar").val().trim();
            $.ajax({
                url:    `${API}/libros`,
                method: 'GET',
                success: function(res) {
                    const libro = res.libros.find(l => l.isbn === isbn);
                    if (libro) {
                        $("#titulo").val(libro.titulo);
                        $("#autor").val(libro.autor);
                        $("#isbn").val(libro.isbn);
                        $("#editorial").val(libro.editorial);
                        $("#anio").val(libro.anio);
                        $("#genero").val(libro.genero);
                        $("#copias").val(libro.copias);
                        $("#descripcion").val(libro.descripcion);
                        $("#formLibro").data("libro-id", libro.id).slideDown(300);
                    } else {
                        alert("No se encontró un libro con ese ISBN.");
                    }
                }
            });
        });

        $("#formLibro").on("submit", function (e) {
            e.preventDefault();
            const esValido = validarFormularioLibro("formLibro");
            if (esValido) {
                modificarLibro($(this).data("libro-id"), {
                    titulo:      $("#titulo").val(),
                    autor:       $("#autor").val(),
                    isbn:        $("#isbn").val(),
                    editorial:   $("#editorial").val(),
                    anio:        $("#anio").val(),
                    genero:      $("#genero").val(),
                    copias:      $("#copias").val(),
                    descripcion: $("#descripcion").val()
                });
            }
        });
    }

    // Formulario ELIMINAR — borrar de BD
    if ($("#formEliminar").length) {
        $("#formEliminar").on("submit", function (e) {
            e.preventDefault();
            const esValido = validarISBN("isbnEliminar");
            if (esValido) {
                eliminarLibro($("#isbnEliminar").val().trim());
            }
        });
    }

    // Hover animado
    $(document).on("mouseenter", ".btn:not(:disabled)", function () {
        $(this).stop(true).animate({ opacity: 0.85 }, 120);
    }).on("mouseleave", ".btn:not(:disabled)", function () {
        $(this).stop(true).animate({ opacity: 1 }, 120);
    });

    // Cargar libros al iniciar si existe el contenedor
    if ($("#bookList").length) {
        cargarLibros();
    }
});