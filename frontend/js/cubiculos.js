/* ══════════════════════════════════════════════════════
   cubiculos.js — Gestión de Cubículos con jQuery
   Biblioteca Universitaria · SEBAS WEST CORPORATION
   Unidad 3 — Programación del Lado del Cliente
══════════════════════════════════════════════════════ */

/* ─────────────────────────────────────────
   CONSTRUCTOR DE CUBÍCULO
   Define la estructura de un objeto Cubículo
───────────────────────────────────────── */
function Cubiculo(id, nombre, capacidad, ocupado, alumno, matricula, inicio, duracion) {
    this.id        = id;
    this.nombre    = nombre;
    this.capacidad = capacidad;
    this.ocupado   = ocupado;
    this.alumno    = alumno    || null;
    this.matricula = matricula || null;
    this.inicio    = inicio    || null;
    this.duracion  = duracion  || null;
}

/* ─────────────────────────────────────────
   CONSTRUCTOR DE PERSONA EN COLA
───────────────────────────────────────── */
function PersonaCola(nombre, matricula, duracion) {
    this.nombre       = nombre;
    this.matricula    = matricula;
    this.duracion     = duracion;
    this.tiempoEspera = Date.now();
}

/* ─────────────────────────────────────────
   DATOS INICIALES
───────────────────────────────────────── */
const _ahora = Date.now();

let cubiculos = [];

function cargarCubiculos() {
    if (typeof API === 'undefined') return;
    $.ajax({
        url: `${API}/cubiculos`,
        method: 'GET',
        success: function(res) {
            if (res.ok) {
                cubiculos = res.cubiculos.map(function(c) {
                    const ocupado = c.estado_reserva === 'activa';
                    const inicio = c.inicio ? new Date(c.inicio).getTime() : null;
                    const fin = c.fin ? new Date(c.fin).getTime() : null;
                    const duracion = (inicio && fin) ? (fin - inicio) / 60000 : null;
                    return new Cubiculo(c.id, c.nombre, c.capacidad, ocupado, c.ocupante, c.matricula, inicio, duracion);
                });
                renderGrid();
            }
        },
        error: function(err) {
            console.error("Error al cargar cubículos", err);
            mostrarToast("Error conectando al servidor.", "error");
        }
    });
}

const cola = [
    new PersonaCola("María López",    "A099001", 60),
    new PersonaCola("Pedro Castillo", "A055432", 90),
];

// Ajustar tiempos de espera de ejemplo
cola[0].tiempoEspera = Date.now() - 12 * 60000;
cola[1].tiempoEspera = Date.now() - 5  * 60000;

let cubiculoSeleccionado = null;

/* ─────────────────────────────────────────
   HELPERS
───────────────────────────────────────── */

/**
 * Convierte minutos decimales a "MM:SS".
 * @param {number} min
 * @returns {string}
 */
function formatMin(min) {
    if (min <= 0) return "00:00";
    const m = Math.floor(min);
    const s = Math.round((min - m) * 60);
    return String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
}

/**
 * Muestra un toast de notificación con fadeIn/fadeOut de jQuery.
 * @param {string} msg
 * @param {string} tipo  — "exito" | "error" | ""
 */
function mostrarToast(msg, tipo) {
    tipo = tipo || "";
    $("#toast")
        .text(msg)
        .attr("class", "toast " + tipo)
        .fadeIn(250)
        .delay(3000)
        .fadeOut(400);
}

/* ─────────────────────────────────────────
   RELOJ EN VIVO
───────────────────────────────────────── */
function actualizarReloj() {
    const t = new Date();
    $("#reloj").text(
        String(t.getHours()).padStart(2, "0")   + ":" +
        String(t.getMinutes()).padStart(2, "0") + ":" +
        String(t.getSeconds()).padStart(2, "0")
    );
}

/* ─────────────────────────────────────────
   RENDER: GRID DE CUBÍCULOS con jQuery
   Usa .append() y .fadeIn() para cada tarjeta
───────────────────────────────────────── */
function renderGrid() {
    const $grid = $("#cubiculosGrid").empty();

    // Bucle for para recorrer el array de cubículos
    for (let i = 0; i < cubiculos.length; i++) {
        const $card = crearTarjetaCubiculo(cubiculos[i]);
        $grid.append($card.hide());
        $card.delay(i * 60).fadeIn(250);
    }
}

/**
 * Crea el elemento jQuery de una tarjeta de cubículo.
 * Usa if/else para determinar estado y botones.
 * @param {Cubiculo} c
 * @returns {jQuery}
 */
function crearTarjetaCubiculo(c) {
    const $card = $("<div>").addClass("cubiculo-card");

    if (!c.ocupado) {
        /* ── LIBRE ── */
        $card.addClass("libre").html(
            '<span class="estado-badge badge-libre">&#10003; DISPONIBLE</span>' +
            '<div class="cubiculo-num">' + c.nombre + '</div>' +
            '<div class="cubiculo-capacidad">Capacidad: ' + c.capacidad + ' personas</div>' +
            '<div class="libre-icon">' +
                '<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">' +
                    '<rect x="4" y="10" width="40" height="28" rx="3" fill="#28a745"/>' +
                    '<rect x="10" y="16" width="28" height="16" rx="2" fill="#fff"/>' +
                    '<rect x="20" y="32" width="8" height="6" fill="#28a745"/>' +
                    '<rect x="14" y="38" width="20" height="3" rx="1" fill="#28a745"/>' +
                '</svg>' +
            '</div>' +
            '<button class="btn btn-green btn-asignar" data-id="' + c.id + '" ' +
                'style="width:100%;margin-top:8px;">ASIGNAR</button>'
        );
    } else {
        /* ── OCUPADO ── */
        const transcurrido = (Date.now() - c.inicio) / 60000;
        const restante     = c.duracion - transcurrido;
        const porcentaje   = Math.max(0, Math.min(100, (restante / c.duracion) * 100));

        const esPorVencer  = restante > 0 && restante <= 10;
        const esVencido    = restante <= 0;

        let claseCard, claseBadge, texBadge, claseBar, claseTimer;

        if (esVencido) {
            claseCard  = "ocupado";
            claseBadge = "badge-ocupado";
            texBadge   = "&#9888; TIEMPO VENCIDO";
            claseBar   = "bar-danger";
            claseTimer = "danger";
        } else if (esPorVencer) {
            claseCard  = "por-vencer";
            claseBadge = "badge-por-vencer";
            texBadge   = "&#9201; POR VENCER";
            claseBar   = "bar-warn";
            claseTimer = "warn";
        } else {
            claseCard  = "ocupado";
            claseBadge = "badge-ocupado";
            texBadge   = "&#9679; OCUPADO";
            claseBar   = porcentaje > 30 ? "bar-ok" : (porcentaje > 10 ? "bar-warn" : "bar-danger");
            claseTimer = "";
        }

        const matriculaTexto = c.matricula !== "Grupo" ? "Mat. " + c.matricula : "Uso grupal";

        $card.addClass(claseCard).html(
            '<span class="estado-badge ' + claseBadge + '">' + texBadge + '</span>' +
            '<div class="cubiculo-num">' + c.nombre + '</div>' +
            '<div class="cubiculo-capacidad">Capacidad: ' + c.capacidad + ' personas</div>' +
            '<div class="ocupante-info">' +
                '<div class="ocupante-nombre">' + c.alumno + '</div>' +
                '<div class="ocupante-matricula">' + matriculaTexto + '</div>' +
                '<div class="timer-bar-wrap">' +
                    '<div class="timer-bar ' + claseBar + '" style="width:' + porcentaje.toFixed(1) + '%"></div>' +
                '</div>' +
                '<div class="timer-texto ' + claseTimer + '" id="timer-' + c.id + '">' +
                    formatMin(Math.max(0, restante)) +
                '</div>' +
                '<div class="card-btns">' +
                    '<button class="btn btn-red btn-liberar" data-id="' + c.id + '">LIBERAR</button>' +
                    '<button class="btn btn-extender" data-id="' + c.id + '" ' +
                        'style="background:#0056b3;color:#fff;font-size:13px;">+30 MIN</button>' +
                '</div>' +
            '</div>'
        );
    }

    return $card;
}

/* ─────────────────────────────────────────
   RENDER: COLA DE ESPERA con jQuery
   Usa .append() y .slideDown()
───────────────────────────────────────── */
function renderCola() {
    const $lista = $("#colaLista").empty();
    const $empty = $("#colaEmpty");

    if (cola.length === 0) {
        $empty.slideDown(200);
        return;
    }

    $empty.hide();

    for (let i = 0; i < cola.length; i++) {
        const p      = cola[i];
        const espera = (Date.now() - p.tiempoEspera) / 60000;
        const esPrimero = i === 0;

        const $li = $("<li>").addClass("cola-item").html(
            '<div class="cola-pos ' + (esPrimero ? "primero" : "") + '">' + (i + 1) + '</div>' +
            '<div class="cola-info">' +
                '<div class="cola-nombre">' + p.nombre + '</div>' +
                '<div class="cola-meta">Mat. ' + p.matricula + ' &nbsp;·&nbsp; Solicitó ' + p.duracion + ' min</div>' +
            '</div>' +
            '<div class="cola-espera">' +
                'Espera: <span id="espera-' + i + '">' + formatMin(espera) + '</span>' +
                (esPrimero ? '<br><span class="cola-siguiente">SIGUIENTE</span>' : "") +
            '</div>' +
            '<button class="btn btn-red btn-quitar-cola" data-idx="' + i + '" ' +
                'style="padding:8px 12px;font-size:12px;margin-left:8px;">&#10005;</button>'
        );

        $lista.append($li.hide());
        $li.delay(i * 80).slideDown(200);
    }
}

/* ─────────────────────────────────────────
   MODAL
───────────────────────────────────────── */
function abrirModal(id) {
    cubiculoSeleccionado = id;
    const c = cubiculos.find(function (x) { return x.id === id; });
    $("#modalTitulo").text("Asignar " + c.nombre);

    if (cola.length > 0) {
        $("#mNombre").val(cola[0].nombre);
        $("#mMatricula").val(cola[0].matricula);
        $("#mDuracion").val(cola[0].duracion);
    } else {
        $("#mNombre, #mMatricula").val("");
        $("#mDuracion").val("60");
    }

    $("#modalAsignar").fadeIn(200);
}

function cerrarModal() {
    $("#modalAsignar").fadeOut(200);
    cubiculoSeleccionado = null;
}

/* ─────────────────────────────────────────
   ACCIONES
───────────────────────────────────────── */
function liberarCubiculo(id) {
    const c    = cubiculos.find(function (x) { return x.id === id; });
    c.ocupado  = false;
    c.alumno   = c.matricula = c.inicio = c.duracion = null;
    mostrarToast(c.nombre + " liberado correctamente.", "exito");
    renderGrid();

    if (cola.length > 0) {
        const sig = cola[0];
        setTimeout(function () {
            mostrarToast("Asignando " + c.nombre + " a " + sig.nombre + " (SIGUIENTE en cola)…", "exito");
        }, 900);
    }
}

function extenderTiempo(id) {
    const c = cubiculos.find(function (x) { return x.id === id; });
    c.duracion += 30;
    mostrarToast("+30 minutos agregados al " + c.nombre + ".", "exito");
}

function agregarCola() {
    const nombre    = $("#inputNombre").val().trim();
    const matricula = $("#inputMatricula").val().trim();
    const duracion  = parseInt($("#inputDuracion").val());

    if (!nombre || !matricula) {
        mostrarToast("Completa nombre y matrícula.", "error");
        return;
    }

    cola.push(new PersonaCola(nombre, matricula, duracion));
    $("#inputNombre, #inputMatricula").val("");
    mostrarToast(nombre + " agregado a la cola (#" + cola.length + ").", "exito");
    renderCola();
}

function quitarCola(idx) {
    const nombre = cola[idx].nombre;
    cola.splice(idx, 1);
    mostrarToast(nombre + " eliminado de la cola.");
    renderCola();
}

function confirmarAsignacion() {
    const nombre    = $("#mNombre").val().trim();
    const matricula = $("#mMatricula").val().trim();
    const duracion  = parseInt($("#mDuracion").val());

    if (!nombre || !matricula) {
        mostrarToast("Completa todos los campos.", "error");
        return;
    }

    const c     = cubiculos.find(function (x) { return x.id === cubiculoSeleccionado; });
    c.ocupado   = true;
    c.alumno    = nombre;
    c.matricula = matricula;
    c.inicio    = Date.now();
    c.duracion  = duracion;

    if (cola.length > 0 && cola[0].nombre === nombre) cola.shift();

    cerrarModal();
    mostrarToast(c.nombre + " asignado a " + nombre + ".", "exito");
    renderGrid();
    renderCola();
}

/* ─────────────────────────────────────────
   TICK — actualiza temporizadores cada segundo
───────────────────────────────────────── */
function tick() {
    for (let i = 0; i < cubiculos.length; i++) {
        const c = cubiculos[i];
        if (!c.ocupado) continue;

        const restante = c.duracion - (Date.now() - c.inicio) / 60000;
        const $timer   = $("#timer-" + c.id);

        if ($timer.length) {
            $timer.text(formatMin(Math.max(0, restante)));
            $timer.attr("class", "timer-texto" +
                (restante <= 0  ? " danger" :
                 restante <= 10 ? " warn"   : ""));
        }
    }

    for (let i = 0; i < cola.length; i++) {
        $("#espera-" + i).text(formatMin((Date.now() - cola[i].tiempoEspera) / 60000));
    }
}

/* ─────────────────────────────────────────
   INICIO — jQuery document ready
───────────────────────────────────────── */
$(function () {

    cargarCubiculos();
    renderCola();
    actualizarReloj();

    setInterval(actualizarReloj, 1000);
    setInterval(tick, 1000);

    /* Botón ASIGNAR — delegado porque las tarjetas se re-renderizan */
    $(document).on("click", ".btn-asignar", function () {
        abrirModal(parseInt($(this).data("id")));
    });

    /* Botón LIBERAR */
    $(document).on("click", ".btn-liberar", function () {
        liberarCubiculo(parseInt($(this).data("id")));
    });

    /* Botón +30 MIN */
    $(document).on("click", ".btn-extender", function () {
        extenderTiempo(parseInt($(this).data("id")));
    });

    /* Botón QUITAR de cola */
    $(document).on("click", ".btn-quitar-cola", function () {
        quitarCola(parseInt($(this).data("idx")));
    });

    /* Botón AGREGAR A COLA */
    $("#btnAgregarCola").on("click", function () {
        agregarCola();
    });

    /* Modal: confirmar y cerrar */
    $("#btnConfirmarAsignacion").on("click", function () {
        confirmarAsignacion();
    });

    $("#btnCerrarModal").on("click", function () {
        cerrarModal();
    });

    /* Cerrar modal al hacer clic fuera */
    $("#modalAsignar").on("click", function (e) {
        if ($(e.target).is("#modalAsignar")) cerrarModal();
    });

    /* Hover animado en botones con jQuery .animate() */
    $(document).on("mouseenter", ".btn:not(:disabled)", function () {
        $(this).stop(true).animate({ opacity: 0.85 }, 100);
    }).on("mouseleave", ".btn:not(:disabled)", function () {
        $(this).stop(true).animate({ opacity: 1 }, 100);
    });

});
