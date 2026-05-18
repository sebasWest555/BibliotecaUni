/* ══════════════════════════════════════════════════════
   auth.js — Gestión de Sesión y Roles
   Se incluye en TODAS las páginas
══════════════════════════════════════════════════════ */

// API dinámico: usa el mismo origen donde corre el frontend.
// Local → https://localhost:3443/api
// Azure → https://biblioteca-donda.azurewebsites.net/api
const API = window.location.origin + '/api';

// ── ESTADO DE SESIÓN ─────────────────────────────────
let sesionActual = null;

function obtenerSesion() {
    const data = localStorage.getItem('biblioteca_sesion');
    return data ? JSON.parse(data) : null;
}

function guardarSesion(usuario, token) {
    localStorage.setItem('biblioteca_sesion', JSON.stringify({ usuario, token }));
    sesionActual = { usuario, token };
}

function cerrarSesionLocal() {
    localStorage.removeItem('biblioteca_sesion');
    sesionActual = null;
}

// ── CONTROL DE VISIBILIDAD POR ROL ───────────────────
function aplicarRol(rol) {
    if (rol === 'admin') {
        $(".solo-admin").show();
        $(".solo-alumno").hide();

        const nombre = sesionActual.usuario.nombre;
        $("#headerAdmin").html(`
            <div class="admin-badge">
                &#9679; ${nombre} (Admin)
                <button id="btnCerrarSesion">Salir &#10005;</button>
            </div>
        `);

        $("#btnCerrarSesion").on("click", function () {
            cerrarSesion();
        });

    } else {
        $(".solo-admin").hide();
        $(".solo-alumno").show();
    }
}

function restaurarVista() {
    $(".solo-admin").hide();
    $("#headerAdmin").html(`
        <button class="btn-admin-login" id="btnAbrirLogin">&#128274; Administrador</button>
    `);
    $("#btnAbrirLogin").on("click", function () {
        $("#modalLogin").fadeIn(200);
    });
}

// ── LOGIN ────────────────────────────────────────────
function login(email, password) {
    $.ajax({
        url: `${API}/usuarios/login`,
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ email, password }),
        success: function (res) {
            if (res.ok) {
                guardarSesion(res.usuario, res.token);
                cerrarModalLogin();
                aplicarRol(res.usuario.rol);
                mostrarToast(`✅ Bienvenido ${res.usuario.nombre}`, 'exito');
            }
        },
        error: function (err) {
            const msg = err.responseJSON ? err.responseJSON.mensaje : 'Error al iniciar sesión';
            $("#errorLogin").text(msg).show();
        }
    });
}

// ── LOGOUT ───────────────────────────────────────────
function cerrarSesion() {
    $.ajax({
        url: `${API}/usuarios/logout`,
        method: 'POST',
        complete: function () {
            cerrarSesionLocal();
            restaurarVista();
            mostrarToast('Sesión cerrada correctamente');
            setTimeout(() => location.reload(), 1000);
        }
    });
}

// ── MODAL LOGIN ──────────────────────────────────────
function cerrarModalLogin() {
    $("#modalLogin").fadeOut(200, function () {
        $(this).removeClass("activo");
    });
    $("#loginEmail, #loginPassword").val('');
    $("#errorLogin").hide().text('');
}

// ── TOAST ────────────────────────────────────────────
function mostrarToast(msg, tipo) {
    tipo = tipo || '';
    $("#toast")
        .text(msg)
        .attr("class", "toast " + tipo)
        .fadeIn(250)
        .delay(3000)
        .fadeOut(400);
}

// ── INICIALIZAR AL CARGAR PÁGINA ─────────────────────
$(function () {

    const sesion = obtenerSesion();
    if (sesion) {
        sesionActual = sesion;
        aplicarRol(sesion.usuario.rol);
    } else {
        restaurarVista();
    }

    $(document).on("click", "#btnAbrirLogin", function () {
        $("#modalLogin").addClass("activo").hide().fadeIn(200);
    });

    $(document).on("click", "#btnCerrarLogin", function () {
        cerrarModalLogin();
    });

    $("#modalLogin").on("click", function (e) {
        if ($(e.target).is("#modalLogin")) cerrarModalLogin();
    });

    $(document).on("click", "#btnConfirmarLogin", function () {
        const email = $("#loginEmail").val().trim();
        const password = $("#loginPassword").val().trim();
        if (!email || !password) {
            $("#errorLogin").text("Completa todos los campos.").show();
            return;
        }
        login(email, password);
    });

    $(document).on("keypress", "#loginPassword", function (e) {
        if (e.which === 13) $("#btnConfirmarLogin").click();
    });
});
