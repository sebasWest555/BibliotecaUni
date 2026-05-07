/* ══════════════════════════════════════════════════════
   validaciones.js — Validación del Lado del Cliente
   Biblioteca Universitaria · SEBAS WEST CORPORATION
   Unidad 3 — Programación del Lado del Cliente
══════════════════════════════════════════════════════ */

/* ─────────────────────────────────────────
   HELPERS DE VALIDACIÓN
───────────────────────────────────────── */

function mostrarError(campoId, mensaje) {
    $("#" + campoId)
        .addClass("input-invalido")
        .removeClass("input-valido");
    $("#error-" + campoId)
        .text(mensaje)
        .addClass("campo-error")
        .removeClass("campo-exito")
        .slideDown(150);
}

function mostrarExito(campoId) {
    $("#" + campoId)
        .addClass("input-valido")
        .removeClass("input-invalido");
    $("#error-" + campoId)
        .text("✓ Correcto")
        .addClass("campo-exito")
        .removeClass("campo-error")
        .slideDown(150);
}

function limpiarCampo(campoId) {
    $("#" + campoId).removeClass("input-valido input-invalido");
    $("#error-" + campoId).text("").hide();
}

/* ─────────────────────────────────────────
   REGLAS DE VALIDACIÓN
───────────────────────────────────────── */

function validarRequerido(campoId, etiqueta) {
    const valor = $("#" + campoId).val().trim();
    if (valor === "") {
        mostrarError(campoId, `El campo "${etiqueta}" es obligatorio.`);
        return false;
    }
    mostrarExito(campoId);
    return true;
}

function validarISBN(campoId) {
    const valor = $("#" + campoId).val().trim();
    if (valor === "") {
        mostrarError(campoId, "El ISBN es obligatorio.");
        return false;
    }
    if (!/^\d{10}$|^\d{13}$/.test(valor)) {
        mostrarError(campoId, "El ISBN debe tener exactamente 10 o 13 dígitos numéricos.");
        return false;
    }
    mostrarExito(campoId);
    return true;
}

function validarAnio(campoId) {
    const valor      = parseInt($("#" + campoId).val());
    const anioActual = new Date().getFullYear();
    if (isNaN(valor)) {
        mostrarError(campoId, "Ingresa un año válido.");
        return false;
    }
    if (valor < 1000 || valor > anioActual) {
        mostrarError(campoId, `El año debe estar entre 1000 y ${anioActual}.`);
        return false;
    }
    mostrarExito(campoId);
    return true;
}

function validarCopias(campoId) {
    const valor = parseInt($("#" + campoId).val());
    if (isNaN(valor) || valor < 1) {
        mostrarError(campoId, "El número de copias debe ser mayor a 0.");
        return false;
    }
    mostrarExito(campoId);
    return true;
}

function validarMatricula(campoId) {
    const valor = $("#" + campoId).val().trim();
    if (valor === "") {
        mostrarError(campoId, "La matrícula es obligatoria.");
        return false;
    }
    if (valor.length < 5) {
        mostrarError(campoId, "La matrícula debe tener al menos 5 caracteres.");
        return false;
    }
    mostrarExito(campoId);
    return true;
}

/* ─────────────────────────────────────────
   CONTROL DEL BOTÓN SUBMIT
───────────────────────────────────────── */

function actualizarBotonSubmit(formId) {
    const hayErrores = $("#" + formId + " .input-invalido").length > 0;
    const $btn = $("#" + formId + " [type='submit']");
    if (hayErrores) {
        $btn.prop("disabled", true).addClass("btn-disabled");
    } else {
        $btn.prop("disabled", false).removeClass("btn-disabled");
    }
}

function validarFormularioLibro(formId) {
    const r1 = validarRequerido("titulo", "Título");
    const r2 = validarRequerido("autor",  "Autor");
    const r3 = validarISBN("isbn");
    const r4 = validarAnio("anio");
    const r5 = validarCopias("copias");
    actualizarBotonSubmit(formId);
    return r1 && r2 && r3 && r4 && r5;
}

/* ─────────────────────────────────────────
   INICIO — jQuery document ready
───────────────────────────────────────── */
$(function () {

    /* ══ FORMULARIO ALTA / MODIFICAR ══ */
    if ($("#formLibro").length) {

        // Validar en tiempo real al salir de cada campo
        $("#titulo").on("blur", function () { validarRequerido("titulo", "Título"); actualizarBotonSubmit("formLibro"); });
        $("#autor").on("blur",  function () { validarRequerido("autor",  "Autor");  actualizarBotonSubmit("formLibro"); });
        $("#isbn").on("blur",   function () { validarISBN("isbn");                  actualizarBotonSubmit("formLibro"); });
        $("#anio").on("blur",   function () { validarAnio("anio");                  actualizarBotonSubmit("formLibro"); });
        $("#copias").on("blur", function () { validarCopias("copias");              actualizarBotonSubmit("formLibro"); });

        $("#isbn").on("input", function () { if ($(this).val().length >= 10) { validarISBN("isbn"); actualizarBotonSubmit("formLibro"); } });
        $("#anio").on("input", function () { if ($(this).val().length === 4) { validarAnio("anio"); actualizarBotonSubmit("formLibro"); } });

        // ── Submit manejado por biblioteca.js ──
        // validaciones.js solo valida los campos, biblioteca.js hace el POST al backend
    }

    /* ══ FORMULARIO ELIMINAR ══ */
    if ($("#formEliminar").length) {

        $("#isbnEliminar").on("blur", function () {
            validarISBN("isbnEliminar");
            actualizarBotonSubmit("formEliminar");
        });

        // ── Submit manejado por biblioteca.js ──
    }

    /* ══ FORMULARIO DEVOLUCIONES ══ */
    if ($("#formDevolucion").length) {

        $("#isbnDevolucion").on("blur",    function () { validarISBN("isbnDevolucion");          actualizarBotonSubmit("formDevolucion"); });
        $("#matriculaDevolucion").on("blur", function () { validarMatricula("matriculaDevolucion"); actualizarBotonSubmit("formDevolucion"); });

        $("#formDevolucion").on("submit", function (e) {
            e.preventDefault();
            const v1 = validarISBN("isbnDevolucion");
            const v2 = validarMatricula("matriculaDevolucion");
            if (v1 && v2) {
                $("#mensajeDevolucion")
                    .text("✓ Devolución registrada correctamente.")
                    .removeClass("msg-error")
                    .addClass("msg-exito")
                    .slideDown(200)
                    .delay(3500)
                    .slideUp(300);
                $(this)[0].reset();
                $(".campo-exito, .campo-error").text("").hide();
                $(".input-valido, .input-invalido").removeClass("input-valido input-invalido");
            }
        });
    }

    /* ══ EFECTO HOVER EN BOTONES ══ */
    $(document).on("mouseenter", ".btn:not(:disabled)", function () {
        $(this).stop(true).animate({ opacity: 0.85 }, 100);
    }).on("mouseleave", ".btn:not(:disabled)", function () {
        $(this).stop(true).animate({ opacity: 1 }, 100);
    });

});