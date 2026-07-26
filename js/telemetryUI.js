/* Módulo para actualizar los indicadores numéricos, textos y LEDs del DOM */
function actualizarTelemetriaUI(data) {
    // Coordenadas
    const elPos = document.getElementById("val-pos");
    const elTheta = document.getElementById("val-theta");
    const elZona = document.getElementById("val-zona");
    const elSonar = document.getElementById("val-sonar");

    if (elPos) elPos.textContent = `X: ${data.x} | Y: ${data.y}`;
    if (elTheta) elTheta.textContent = `${data.theta}°`;
    if (elZona) elZona.textContent = data.zona;
    if (elSonar) elSonar.textContent = `${data.sonar_cm} cm`;

    // Indicadores LEDs de sensores IR (1 = sobre línea blanca / detectado)
    if (data.ir && data.ir.length === 4) {
        for (let i = 0; i < 4; i++) {
            const led = document.getElementById(`led-s${i + 1}`);
            if (led) {
                if (data.ir[i] === 1) {
                    led.className = "w-3 h-3 rounded-full bg-rose-500 shadow-sm shadow-rose-500/50 animate-pulse";
                } else {
                    led.className = "w-3 h-3 rounded-full bg-slate-300 dark:bg-slate-700";
                }
            }
        }
    }
}