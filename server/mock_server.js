const { WebSocketServer } = require('ws');

// Puerto para el simulador
const PORT = 8080;
const socket = new WebSocket('wss://twistable-snitch-impure.ngrok-free.dev');
const wss = new WebSocketServer({ port: PORT });

console.log(`[SIMULADOR] Servidor Mock activo en ws://localhost:${PORT}`);

// Variables de estado del robot virtual
let state = {
    x: 0.0,
    y: 34.5,
    theta: 0.0,
    zona: "EXTERIOR",
    estado: "ALINEAR_IR",
    distanciaCentro: 34.5,
    ir: [1, 1, 0, 0], // [s1, s2, s3, s4]
    sonar_cm: 45.0
};

// Estados posibles para simular el comportamiento
const posiblesEstados = ["FORWARD", "BACKWARD", "WIGGLE", "ALINEAR_IR", "SCAN", "STOP"];

// Función para simular movimiento paso a paso
function simularPaso() {
    // 1. Cambiar aleatoriamente de estado cada cierto tiempo
    if (Math.random() < 0.03) {
        state.estado = posiblesEstados[Math.floor(Math.random() * posiblesEstados.length)];
    }

    // 2. Simular cambio en las coordenadas físicas según el estado
    const dt = 0.05; // 50ms
    const velocidad = 12.0; // cm/s simular velocidad promedio

    if (state.estado === "FORWARD") {
        const rad = (state.theta * Math.PI) / 180;
        state.x += velocidad * Math.sin(rad) * dt;
        state.y -= velocidad * Math.cos(rad) * dt;
    } else if (state.estado === "BACKWARD") {
        const rad = (state.theta * Math.PI) / 180;
        state.x -= velocidad * Math.sin(rad) * dt;
        state.y += velocidad * Math.cos(rad) * dt;
    } else if (state.estado === "WIGGLE" || state.estado === "SCAN") {
        state.theta = (state.theta + (Math.random() > 0.5 ? 15 : -15)) % 360;
    }

    // 3. Mantener al robot dentro del radio razonable del Dohyo (r ≈ 38.5 cm)
    state.distanciaCentro = Math.sqrt(state.x * state.x + state.y * state.y);

    if (state.distanciaCentro > 38.5) {
        // Si sobrepasa el borde, rebota hacia adentro
        state.x *= 0.9;
        state.y *= 0.9;
        state.estado = "BACKWARD";
        state.ir = [1, 1, 0, 0]; // Simula detectar línea blanca
    } else {
        state.ir = [0, 0, 0, 0]; // Sobre la pista negra
    }

    // 4. Calcular zona
    if (state.distanciaCentro <= 15) state.zona = "CENTRO";
    else if (state.distanciaCentro <= 28) state.zona = "INTERMEDIA";
    else state.zona = "EXTERIOR";

    // 5. Simular sensor ultrasónico (Sonar)
    // Simular la presencia periódica de un oponente cercano
    state.sonar_cm = Math.floor(15 + Math.random() * 50);

    // Formatear números a 2 decimales para limpieza
    return {
        type: "telemetry",
        mode: "mock", // <--- Etiqueta de simulación
        x: parseFloat(state.x.toFixed(2)),
        y: parseFloat(state.y.toFixed(2)),
        theta: parseFloat(state.theta.toFixed(1)),
        zona: state.zona,
        estado: state.estado,
        distanciaCentro: parseFloat(state.distanciaCentro.toFixed(2)),
        ir: state.ir,
        sonar_cm: state.sonar_cm
    };
}

// Eventos de conexión
wss.on('connection', (ws) => {
    console.log('[SIMULADOR] Cliente conectado (Dashboard)');

    // Bucle de envío de datos cada 50 ms (20 Hz)
    const interval = setInterval(() => {
        if (ws.readyState === ws.OPEN) {
            const dataPacket = simularPaso();
            ws.send(JSON.stringify(dataPacket));
        }
    }, 50);

    ws.on('close', () => {
        console.log('[SIMULADOR] Cliente desconectado');
        clearInterval(interval);
    });
});


// USOOOOOO: EN UNA TERMINAL bash: node mock_server.js
// ABRIR EL FILE INDEX.HTML ANTES