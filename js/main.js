// Inicializar Íconos Lucide
document.addEventListener("DOMContentLoaded", () => {
    if (window.lucide) {
        lucide.createIcons();
    }
});

/* ==========================================================================
   1. CONTROL DE MODO CLARO / OSCURO (THEME TOGGLE)
   ========================================================================== */
function toggleTheme() {
    const htmlElement = document.documentElement;

    if (htmlElement.classList.contains("dark")) {
        htmlElement.classList.remove("dark");
        localStorage.setItem("theme", "light");
    } else {
        htmlElement.classList.add("dark");
        localStorage.setItem("theme", "dark");
    }
}

// Cargar preferencia guardada de tema al iniciar
(function cargarTemaGuardado() {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "light") {
        document.documentElement.classList.remove("dark");
    } else {
        document.documentElement.classList.add("dark");
    }
})();

/* ==========================================================================
   2. NAVEGACIÓN ENTRE PESTAÑAS (INICIO / TELEMETRÍA)
   ========================================================================== */
function cambiarPestana(pestana) {
    const tabInicio = document.getElementById("tab-inicio");
    const tabTelemetria = document.getElementById("tab-telemetria");
    const btnInicio = document.getElementById("btn-tab-inicio");
    const btnTelemetria = document.getElementById("btn-tab-telemetria");

    const activeBtnClasses = ["bg-white", "dark:bg-slate-700", "text-slate-900", "dark:text-white", "shadow-sm"];
    const inactiveBtnClasses = ["text-slate-600", "dark:text-slate-400", "hover:text-slate-900", "dark:hover:text-white"];

    if (pestana === "inicio") {
        // Mostrar Tab Inicio
        tabInicio.classList.remove("hidden");
        tabInicio.classList.add("block");
        tabTelemetria.classList.remove("grid");
        tabTelemetria.classList.add("hidden");

        // Estilos Botones
        btnInicio.classList.add(...activeBtnClasses);
        btnInicio.classList.remove(...inactiveBtnClasses);
        btnTelemetria.classList.remove(...activeBtnClasses);
        btnTelemetria.classList.add(...inactiveBtnClasses);

    } else if (pestana === "telemetria") {
        // Mostrar Tab Telemetría
        tabTelemetria.classList.remove("hidden");
        tabTelemetria.classList.add("grid");
        tabInicio.classList.remove("block");
        tabInicio.classList.add("hidden");

        // Estilos Botones
        btnTelemetria.classList.add(...activeBtnClasses);
        btnTelemetria.classList.remove(...inactiveBtnClasses);
        btnInicio.classList.remove(...activeBtnClasses);
        btnInicio.classList.add(...inactiveBtnClasses);
    }
}

/* ==========================================================================
   3. MOSTRADOR Y RESALTADO DE ESTADOS (PROGRAMACIÓN FLUX)
   ========================================================================== */
const listaEstados = ["FORWARD", "BACKWARD", "WIGGLE", "ALINEAR_IR", "SCAN", "STOP"];

function actualizarEstadoProgramacion(nuevoEstado) {
    const elEstadoTexto = document.getElementById("val-estado");
    if (elEstadoTexto) {
        elEstadoTexto.textContent = nuevoEstado;
    }

    // Desmarcar todos los sub-badges
    listaEstados.forEach(est => {
        const el = document.getElementById(`state-${est.toLowerCase()}`);
        if (el) {
            el.className = "p-1.5 text-center rounded border bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400";
        }
    });

    // Resaltar el estado activo actual
    const estadoNormalizado = nuevoEstado.toLowerCase();
    const elActivo = document.getElementById(`state-${estadoNormalizado}`);
    if (elActivo) {
        elActivo.className = "p-1.5 text-center rounded border border-cyan-500 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-bold shadow-sm";
    }
}
/* ==========================================================================
   4. GESTIÓN DE RED Y RECONEXIÓN AUTOMÁTICA
   ========================================================================== */

// Direcciones por defecto
const MOCK_URL = "wss://twistable-snitch-impure.ngrok-free.dev";
let sumoRealIP = localStorage.getItem("cenfobot_ip") || "192.168.1.50";

// Estado de red
let modoActual = localStorage.getItem("cenfobot_mode") || "mock"; // 'mock' o 'real'
let socket = null;
let reconnectTimer = null;

// Referencias del DOM
const statusDot = document.getElementById("status-dot");
const statusText = document.getElementById("status-text");
const btnMock = document.getElementById("btn-mode-mock");
const btnReal = document.getElementById("btn-mode-real");

// Obtener la URL activa según el botón seleccionado
function getActiveURL() {
    return modoActual === "mock" ? MOCK_URL : `ws://${sumoRealIP}:8080`;
}

// Función principal de conexión
function conectar() {
    // Limpiar cualquier intento previo de reconexión
    if (reconnectTimer) clearTimeout(reconnectTimer);

    // Si ya hay un socket abierto, cerrarlo limpiamente antes de abrir uno nuevo
    if (socket) {
        socket.onclose = null; // Evitar que el evento onclose dispare doble reconexión
        socket.close();
    }

    const targetURL = getActiveURL();
    console.log(`[RED] Intentando conectar a: ${targetURL}`);

    // Actualizar UI a "Conectando..."
    statusDot.className = "h-2.5 w-2.5 rounded-full bg-amber-500 animate-pulse";
    statusText.textContent = modoActual === "mock" ? "Iniciando Simulador..." : `Buscando ${sumoRealIP}...`;
    statusText.className = "text-xs font-semibold text-amber-600 dark:text-amber-400";

    try {
        socket = new WebSocket(targetURL);

        socket.onopen = () => {
            console.log(`[RED] Conexión establecida con éxito.`);
            if (modoActual === "mock") {
                statusDot.className = "h-2.5 w-2.5 rounded-full bg-purple-500 animate-pulse";
                statusText.textContent = "Modo: Datos Simulados";
                statusText.className = "text-xs font-semibold text-purple-600 dark:text-purple-400";
            } else {
                statusDot.className = "h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse";
                statusText.textContent = `Cenfobot Conectado (${sumoRealIP})`;
                statusText.className = "text-xs font-semibold text-emerald-600 dark:text-emerald-400";
            }
        };

        socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);

                // 1. Estado del Algoritmo
                if (data.estado && typeof actualizarEstadoProgramacion === "function") {
                    actualizarEstadoProgramacion(data.estado);
                }

                // 2. Telemetría textual y LEDs
                if (typeof actualizarTelemetriaUI === "function") {
                    actualizarTelemetriaUI(data);
                }

                // 3. Dohyo 2D Canvas
                if (typeof renderizarDohyo === "function") {
                    renderizarDohyo(data);
                }
            } catch (err) {
                console.error("[RED] Error al procesar el paquete JSON:", err);
            }
        };

        socket.onclose = () => {
            console.warn("[RED] Conexión perdida. Reintentando en 3 segundos...");
            statusDot.className = "h-2.5 w-2.5 rounded-full bg-rose-500 animate-pulse";
            statusText.textContent = modoActual === "mock" ? "Simulador Desconectado (Reintentando...)" : "Cenfobot Desconectado (Reintentando...)";
            statusText.className = "text-xs font-semibold text-rose-600 dark:text-rose-400";

            // Programar reconexión en 3 segundos
            reconnectTimer = setTimeout(conectar, 3000);
        };

        socket.onerror = (err) => {
            console.error("[RED] Error en el Socket:", err);
            socket.close(); // Forzar cierre para entrar al onclose
        };

    } catch (e) {
        console.error("[RED] Error de creación del WebSocket:", e);
        reconnectTimer = setTimeout(conectar, 3000);
    }
}

/* Cambiar dinámicamente de fuente de datos desde los botones de la barra */
function cambiarFuenteDatos(nuevoModo) {
    if (modoActual === nuevoModo && socket && socket.readyState === WebSocket.OPEN) return;

    modoActual = nuevoModo;
    localStorage.setItem("cenfobot_mode", modoActual);
    actualizarEstilosBotonesRed();

    // Reiniciar conexión con la nueva URL
    conectar();
}

/* Prompt rápido para cambiar la IP del ESP32 */
function configurarIPReal() {
    const nuevaIP = prompt("Ingresa la dirección IP del Cenfobot (ESP32):", sumoRealIP);
    if (nuevaIP && nuevaIP.trim() !== "") {
        sumoRealIP = nuevaIP.trim();
        localStorage.setItem("cenfobot_ip", sumoRealIP);

        // Si estábamos en modo Cenfobot Real, reconectar inmediatamente
        if (modoActual === "real") {
            conectar();
        }
    }
}

/* Actualizar la apariencia de los botones Selector de Red */
function actualizarEstilosBotonesRed() {
    const activeClassMock = ["bg-purple-600", "text-white", "shadow-sm"];
    const activeClassReal = ["bg-emerald-600", "text-white", "shadow-sm"];
    const inactiveClass = ["text-slate-600", "dark:text-slate-400", "hover:text-slate-900", "dark:hover:text-white"];

    if (modoActual === "mock") {
        btnMock.className = `px-3 py-1 rounded font-semibold transition-all ${activeClassMock.join(" ")}`;
        btnReal.className = `px-3 py-1 rounded font-semibold transition-all ${inactiveClass.join(" ")}`;
    } else {
        btnReal.className = `px-3 py-1 rounded font-semibold transition-all ${activeClassReal.join(" ")}`;
        btnMock.className = `px-3 py-1 rounded font-semibold transition-all ${inactiveClass.join(" ")}`;
    }
}

// Inicializar botones y primera conexión al cargar la página
actualizarEstilosBotonesRed();
conectar();