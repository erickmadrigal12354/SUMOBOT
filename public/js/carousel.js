/* ==========================================================================
   CARRUSEL DE IMÁGENES DE FONDO EN PORTADA HERO
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
    const slides = document.querySelectorAll(".carousel-slide");
    if (!slides || slides.length === 0) return;

    let currentSlide = 0;
    const slideInterval = 4000; // Cambia cada 4 segundos

    setInterval(() => {
        // Transición suave: ocultar slide actual
        slides[currentSlide].classList.remove("opacity-100");
        slides[currentSlide].classList.add("opacity-0");

        // Pasar al siguiente slide (ciclo infinito)
        currentSlide = (currentSlide + 1) % slides.length;

        // Mostrar el nuevo slide
        slides[currentSlide].classList.remove("opacity-0");
        slides[currentSlide].classList.add("opacity-100");
    }, slideInterval);
});