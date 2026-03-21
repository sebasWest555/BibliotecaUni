/* ══════════════════════════════════════════════════════
   cubiculos.js  —  Lógica de Gestión de Cubículos
   Biblioteca Universitaria · SEBAS WEST CORPORATION
══════════════════════════════════════════════════════ */

/* ─────────────────────────────────────────
   DATOS INICIALES
───────────────────────────────────────── */
const _ahora = Date.now();

let cubiculos = [
    { id: 1, nombre: "Cubículo 1", capacidad: 2, ocupado: true,  alumno: "Carlos Mendoza",  matricula: "A010201", inicio: _ahora - 45 * 60000, duracion: 60  },
    { id: 2, nombre: "Cubículo 2", capacidad: 4, ocupado: true,  alumno: "Sofía Ramírez",   matricula: "A030405", inicio: _ahora - 55 * 60000, duracion: 60  },
    { id: 3, nombre: "Cubículo 3", capacidad: 2, ocupado: false, alumno: null, matricula: null, inicio: null, duracion: null },
    { id: 4, nombre: "Cubículo 4", capacidad: 6, ocupado: true,  alumno: "Grupo: Ing. 4°B", matricula: "Grupo",   inicio: _ahora - 30 * 60000, duracion: 120 },
    { id: 5, nombre: "Cubículo 5", capacidad: 2, ocupado: false, alumno: null, matricula: null, inicio: null, duracion: null },
    { id: 6, nombre: "Cubículo 6", capacidad: 4, ocupado: true,  alumno: "Luis Herrera",    matricula: "A078901", inicio: _ahora - 10 * 60000, duracion: 90  },
    { id: 7, nombre: "Cubículo 7", capacidad: 2, ocupado: false, alumno: null, matricula: null, inicio: null, duracion: null },
    { id: 8, nombre: "Cubículo 8", capacidad: 4, ocupado: false, alumno: null, matricula: null, inicio: null, duracion: null },
];

let cola = [
    { nombre: "María López",    matricula: "A099001", duracion: 60, tiempoEspera: Date.now() - 12 * 60000 },
    { nombre: "Pedro Castillo", matricula: "A055432", duracion: 90, tiempoEspera: Date.now() - 5  * 60000 },
];

let cubiculoSeleccionado = null;

/* ─────────────────────────────────────────
   RELOJ EN VIVO
───────────────────────────────────────── */
function actualizarReloj() {
    const t = new Date();
    document.getElementById("reloj").textContent =
        String(t.getHours()).padStart(2, "0")   + ":" +
        String(t.getMinutes()).padStart(2, "0") + ":" +
        String(t.getSeconds()).padStart(2, "0");
}

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
 * Muestra un toast de notificación en pantalla.
 * @param {string} msg   - Texto del mensaje
 * @param {string} tipo  - "exito" | "error" | "" (azul por defecto)
 */
function mostrarToast(msg, tipo = "") {
    const t = document.getElementById("toast");
    t.textContent = msg;
    t.className = "toast show " + tipo;
    setTimeout(() => { t.className = "toast"; }, 3000);
}

/* ─────────────────────────────────────────
   RENDER: GRID DE CUBÍCULOS
───────────────────────────────────────── */
function renderGrid() {
    const grid = document.getElementById("cubiculosGrid");
    grid.innerHTML = "";

    cubiculos.forEach(c => {
        const card = document.createElement("div");
        card.className = "cubiculo-card";

        if (!c.ocupado) {
            /* ── TARJETA LIBRE ── */
            card.classList.add("libre");
            card.innerHTML = `
                <span class="estado-badge badge-libre">&#10003; DISPONIBLE</span>
                <div class="cubiculo-num">${c.nombre}</div>
                <div class="cubiculo-capacidad">Capacidad: ${c.capacidad} personas</div>
                <div class="libre-icon">
                    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="4"  y="10" width="40" height="28" rx="3" fill="#28a745"/>
                        <rect x="10" y="16" width="28" height="16" rx="2" fill="#fff"/>
                        <rect x="20" y="32" width="8"  height="6"  fill="#28a745"/>
                        <rect x="14" y="38" width="20" height="3"  rx="1" fill="#28a745"/>
                    </svg>
                </div>
                <button class="btn btn-green" style="width:100%;margin-top:8px;"
                    onclick="abrirModal(${c.id})">ASIGNAR</button>
            `;
        } else {
            /* ── TARJETA OCUPADA ── */
            const transcurrido = (Date.now() - c.inicio) / 60000;
            const restante     = c.duracion - transcurrido;
            const porcentaje   = Math.max(0, Math.min(100, (restante / c.duracion) * 100));

            const esPorVencer = restante > 0 && restante <= 10;
            const esVencido   = restante <= 0;

            const claseCard  = esVencido ? "ocupado" : (esPorVencer ? "por-vencer" : "ocupado");
            const claseBadge = esVencido ? "badge-ocupado" : (esPorVencer ? "badge-por-vencer" : "badge-ocupado");
            const texBadge   = esVencido ? "&#9888; TIEMPO VENCIDO" : (esPorVencer ? "&#9201; POR VENCER" : "&#9679; OCUPADO");
            const claseBar   = porcentaje > 30 ? "bar-ok" : (porcentaje > 10 ? "bar-warn" : "bar-danger");
            const claseTimer = esPorVencer ? "warn" : (esVencido ? "danger" : "");

            card.classList.add(claseCard);
            card.innerHTML = `
                <span class="estado-badge ${claseBadge}">${texBadge}</span>
                <div class="cubiculo-num">${c.nombre}</div>
                <div class="cubiculo-capacidad">Capacidad: ${c.capacidad} personas</div>
                <div class="ocupante-info">
                    <div class="ocupante-nombre">${c.alumno}</div>
                    <div class="ocupante-matricula">${c.matricula !== "Grupo" ? "Mat. " + c.matricula : "Uso grupal"}</div>
                    <div class="timer-bar-wrap">
                        <div class="timer-bar ${claseBar}" style="width:${porcentaje.toFixed(1)}%"></div>
                    </div>
                    <div class="timer-texto ${claseTimer}" id="timer-${c.id}">
                        ${formatMin(Math.max(0, restante))}
                    </div>
                    <div class="card-btns">
                        <button class="btn btn-red"
                            onclick="liberarCubiculo(${c.id})">LIBERAR</button>
                        <button class="btn" style="background:#0056b3;color:#fff;font-size:13px;"
                            onclick="extenderTiempo(${c.id})">+30 MIN</button>
                    </div>
                </div>
            `;
        }

        grid.appendChild(card);
    });
}

/* ─────────────────────────────────────────
   RENDER: COLA DE ESPERA
───────────────────────────────────────── */
function renderCola() {
    const lista = document.getElementById("colaLista");
    const empty = document.getElementById("colaEmpty");

    if (cola.length === 0) {
        lista.innerHTML = "";
        empty.style.display = "block";
        return;
    }

    empty.style.display = "none";
    lista.innerHTML = "";

    cola.forEach((p, i) => {
        const espera = (Date.now() - p.tiempoEspera) / 60000;
        const li = document.createElement("li");
        li.className = "cola-item";
        li.innerHTML = `
            <div class="cola-pos ${i === 0 ? "primero" : ""}">${i + 1}</div>
            <div class="cola-info">
                <div class="cola-nombre">${p.nombre}</div>
                <div class="cola-meta">Mat. ${p.matricula} &nbsp;·&nbsp; Solicitó ${p.duracion} min</div>
            </div>
            <div class="cola-espera">
                Espera: <span>${formatMin(espera)}</span>
                ${i === 0 ? '<br><span style="color:#28a745;font-size:12px;font-weight:bold;">SIGUIENTE</span>' : ""}
            </div>
            <button class="btn btn-red" style="padding:8px 12px;font-size:12px;margin-left:8px;"
                onclick="quitarCola(${i})">&#10005;</button>
        `;
        lista.appendChild(li);
    });
}

/* ─────────────────────────────────────────
   ACCIONES: CUBÍCULOS
───────────────────────────────────────── */

/**
 * Libera un cubículo ocupado y avisa si hay alguien en cola.
 * @param {number} id - ID del cubículo
 */
function liberarCubiculo(id) {
    const c = cubiculos.find(x => x.id === id);
    c.ocupado   = false;
    c.alumno    = null;
    c.matricula = null;
    c.inicio    = null;
    c.duracion  = null;

    mostrarToast(`${c.nombre} liberado correctamente.`, "exito");
    renderGrid();

    if (cola.length > 0) {
        const sig = cola[0];
        setTimeout(() => {
            mostrarToast(`Asignando ${c.nombre} a ${sig.nombre} (SIGUIENTE en cola)…`, "exito");
        }, 800);
    }
}

/**
 * Extiende 30 minutos el tiempo de un cubículo.
 * @param {number} id - ID del cubículo
 */
function extenderTiempo(id) {
    const c = cubiculos.find(x => x.id === id);
    c.duracion += 30;
    mostrarToast(`+30 minutos agregados al ${c.nombre}.`, "exito");
}

/* ─────────────────────────────────────────
   ACCIONES: COLA DE ESPERA
───────────────────────────────────────── */

/**
 * Agrega un alumno a la cola desde el formulario inferior.
 */
function agregarCola() {
    const nombre    = document.getElementById("inputNombre").value.trim();
    const matricula = document.getElementById("inputMatricula").value.trim();
    const duracion  = parseInt(document.getElementById("inputDuracion").value);

    if (!nombre || !matricula) {
        mostrarToast("Completa nombre y matrícula.", "error");
        return;
    }

    cola.push({ nombre, matricula, duracion, tiempoEspera: Date.now() });
    document.getElementById("inputNombre").value    = "";
    document.getElementById("inputMatricula").value = "";

    mostrarToast(`${nombre} agregado a la cola (#${cola.length}).`, "exito");
    renderCola();
}

/**
 * Elimina a una persona de la cola por índice.
 * @param {number} idx - Índice en el arreglo cola[]
 */
function quitarCola(idx) {
    const nombre = cola[idx].nombre;
    cola.splice(idx, 1);
    mostrarToast(`${nombre} eliminado de la cola.`);
    renderCola();
}

/* ─────────────────────────────────────────
   MODAL DE ASIGNACIÓN
───────────────────────────────────────── */

/**
 * Abre el modal de asignación para un cubículo libre.
 * Si hay cola, prellenar con el primer alumno en espera.
 * @param {number} id - ID del cubículo
 */
function abrirModal(id) {
    cubiculoSeleccionado = id;
    const c = cubiculos.find(x => x.id === id);
    document.getElementById("modalTitulo").textContent = `Asignar ${c.nombre}`;

    if (cola.length > 0) {
        document.getElementById("mNombre").value    = cola[0].nombre;
        document.getElementById("mMatricula").value = cola[0].matricula;
        document.getElementById("mDuracion").value  = cola[0].duracion;
    } else {
        document.getElementById("mNombre").value    = "";
        document.getElementById("mMatricula").value = "";
        document.getElementById("mDuracion").value  = "60";
    }

    document.getElementById("modalAsignar").classList.add("show");
}

/**
 * Cierra el modal de asignación.
 */
function cerrarModal() {
    document.getElementById("modalAsignar").classList.remove("show");
    cubiculoSeleccionado = null;
}

/**
 * Confirma la asignación del cubículo seleccionado.
 */
function confirmarAsignacion() {
    const nombre    = document.getElementById("mNombre").value.trim();
    const matricula = document.getElementById("mMatricula").value.trim();
    const duracion  = parseInt(document.getElementById("mDuracion").value);

    if (!nombre || !matricula) {
        mostrarToast("Completa todos los campos.", "error");
        return;
    }

    const c     = cubiculos.find(x => x.id === cubiculoSeleccionado);
    c.ocupado   = true;
    c.alumno    = nombre;
    c.matricula = matricula;
    c.inicio    = Date.now();
    c.duracion  = duracion;

    // Si el asignado era el primero de la cola, quitarlo
    if (cola.length > 0 && cola[0].nombre === nombre) {
        cola.shift();
    }

    cerrarModal();
    mostrarToast(`${c.nombre} asignado a ${nombre}.`, "exito");
    renderGrid();
    renderCola();
}

/* ─────────────────────────────────────────
   LOOP PRINCIPAL — tick cada segundo
   Actualiza sólo los elementos dinámicos
   sin re-renderizar el DOM completo.
───────────────────────────────────────── */
function tick() {
    // Temporizadores de cubículos ocupados
    cubiculos.forEach(c => {
        if (!c.ocupado) return;
        const transcurrido = (Date.now() - c.inicio) / 60000;
        const restante     = c.duracion - transcurrido;
        const el = document.getElementById("timer-" + c.id);
        if (el) {
            el.textContent = formatMin(Math.max(0, restante));
            el.className   = "timer-texto" +
                (restante <= 0  ? " danger" :
                 restante <= 10 ? " warn"   : "");
        }
    });

    // Tiempos de espera en la cola
    document.querySelectorAll(".cola-espera span").forEach((span, i) => {
        if (cola[i]) {
            span.textContent = formatMin((Date.now() - cola[i].tiempoEspera) / 60000);
        }
    });
}

/* ─────────────────────────────────────────
   INICIALIZACIÓN
───────────────────────────────────────── */
setInterval(actualizarReloj, 1000);
setInterval(tick, 1000);

actualizarReloj();
renderGrid();
renderCola();
