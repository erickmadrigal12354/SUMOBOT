/* ==========================================================================
   RENDERIZADO 2D DEL DOHYO, SUMOBOT, OPONENTE Y TRAYECTORIA
   ========================================================================== */

const canvas = document.getElementById("dohyoCanvas");
const ctx = canvas ? canvas.getContext("2d") : null;

// Historial para el rastro de trayectoria (máximo 25 puntos)
const trayectoria = [];
const MAX_TRAYECTORIA = 25;

function renderizarDohyo(data) {
    if (!canvas || !ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;

    // Escala: traducir el radio real del Dohyo (38.5 cm) a ~180 píxeles en el Canvas
    const radioDohyoCm = 80.0;
    const escala = 180 / radioDohyoCm;

    // -------------------------------------------------------------------------
    // 1. LIMPIAR CANVAS
    // -------------------------------------------------------------------------
    ctx.clearRect(0, 0, width, height);

    // Detectar si algún sensor IR está sobre la línea blanca (alerta de borde)
    const sobreLineaBlanca = data.ir && data.ir.some(val => val === 1);

    // -------------------------------------------------------------------------
    // 2. DIBUJAR PISTA DEL DOHYO
    // -------------------------------------------------------------------------
    ctx.beginPath();
    ctx.arc(centerX, centerY, radioDohyoCm * escala, 0, 2 * Math.PI);
    ctx.fillStyle = "#0f172a"; // Fondo oscuro de la pista
    ctx.fill();
    ctx.lineWidth = sobreLineaBlanca ? 8 : 5;
    // Si toca línea, el borde destella en rojo; si no, permanece blanco brillante
    ctx.strokeStyle = sobreLineaBlanca ? "#f43f5e" : "#f8fafc";
    ctx.stroke();

    // Guías de zonas internas (Centro y Zona Intermedia)
    [15, 28].forEach(r => {
        ctx.beginPath();
        ctx.arc(centerX, centerY, r * escala, 0, 2 * Math.PI);
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = "#334155";
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.setLineDash([]);
    });

    // -------------------------------------------------------------------------
    // 3. RASTRO DE TRAYECTORIA (TRAIL)
    // -------------------------------------------------------------------------
    const robotCanvasX = centerX + (data.x * escala);
    const robotCanvasY = centerY + (data.y * escala);

    // Guardar nueva posición
    trayectoria.push({ x: robotCanvasX, y: robotCanvasY });
    if (trayectoria.length > MAX_TRAYECTORIA) {
        trayectoria.shift(); // Eliminar el punto más antiguo
    }

    // Dibujar línea de recorrido con desvanecimiento (fade)
    if (trayectoria.length > 1) {
        for (let i = 0; i < trayectoria.length - 1; i++) {
            ctx.beginPath();
            ctx.moveTo(trayectoria[i].x, trayectoria[i].y);
            ctx.lineTo(trayectoria[i + 1].x, trayectoria[i + 1].y);
            const alpha = (i + 1) / trayectoria.length; // Transparencia progresiva
            ctx.strokeStyle = `rgba(6, 182, 212, ${alpha * 0.6})`; // Cyan con opacidad
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    }

    // Ángulo de orientación convertido a radianes (Ajuste para Canvas: -90°)
    const angleRad = (data.theta - 90) * (Math.PI / 180);

    // -------------------------------------------------------------------------
    // 4. DIBUJAR OPONENTE DETECTADO (SI ESTÁ A MENOS DE 38 CM)
    // -------------------------------------------------------------------------
    const distSonar = data.sonar_cm;

    if (distSonar > 0 && distSonar <= 80) {
        // Calcular coordenadas del oponente usando trigonometría
        const oponenteX = robotCanvasX + (distSonar * escala) * Math.cos(angleRad);
        const oponenteY = robotCanvasY + (distSonar * escala) * Math.sin(angleRad);

        // Dibujar línea de visión hacia el rival
        ctx.beginPath();
        ctx.moveTo(robotCanvasX, robotCanvasY);
        ctx.lineTo(oponenteX, oponenteY);
        ctx.strokeStyle = distSonar <= 20 ? "#f43f5e" : "#fbbf24"; // Rojo si está cerca, amarillo si está más lejos
        ctx.lineWidth = 1.5;
        ctx.setLineDash([3, 3]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Dibujar cuadrado del Oponente Virtual
        const tamanoOponente = 22; // Tamaño en píxeles
        ctx.save();
        ctx.translate(oponenteX, oponenteY);
        ctx.rotate(angleRad + Math.PI / 2); // Rotar con la misma orientación

        ctx.fillStyle = distSonar <= 20 ? "rgba(244, 63, 94, 0.85)" : "rgba(251, 191, 36, 0.85)";
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1.5;

        // Cuadro centrado
        ctx.fillRect(-tamanoOponente / 2, -tamanoOponente / 2, tamanoOponente, tamanoOponente);
        ctx.strokeRect(-tamanoOponente / 2, -tamanoOponente / 2, tamanoOponente, tamanoOponente);

        // Etiqueta flotante con la distancia exacta
        ctx.restore();
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 10px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(`${distSonar} cm`, oponenteX, oponenteY - 14);
    }

    // -------------------------------------------------------------------------
    // 5. DIBUJAR EL SUMOBOT (NUESTRO ROBOT)
    // -------------------------------------------------------------------------
    ctx.save();
    ctx.translate(robotCanvasX, robotCanvasY);
    ctx.rotate(angleRad + Math.PI / 2);

    // Cuerpo en forma de flecha/chasis estilizado
    ctx.beginPath();
    ctx.moveTo(0, -14); // Punta (Frente del robot)
    ctx.lineTo(-11, 11); // Esquina trasera izquierda
    ctx.lineTo(0, 7); // Indentación trasera
    ctx.lineTo(11, 11); // Esquina trasera derecha
    ctx.closePath();

    ctx.fillStyle = "#06b6d4"; // Color cyan brillante
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#ffffff";
    ctx.stroke();

    // Indicador de centro/origen del robot
    ctx.beginPath();
    ctx.arc(0, 0, 2.5, 0, 2 * Math.PI);
    ctx.fillStyle = "#ffffff";
    ctx.fill();

    ctx.restore();
}