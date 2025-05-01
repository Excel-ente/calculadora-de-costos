document.addEventListener('DOMContentLoaded', () => {
    // Selecciona todos los botones de cabecera (tanto de categoría como de item)
    const headers = document.querySelectorAll('.cost-category-header, .cost-item-header');

    headers.forEach(header => {
        header.addEventListener('click', () => {
            // Toggle (añadir/quitar) la clase 'active' en la cabecera clickeada
            header.classList.toggle('active');

            // Encuentra el contenido asociado a esta cabecera
            // (asumimos que el contenido es el siguiente elemento hermano)
            const content = header.nextElementSibling;

            if (content && (content.classList.contains('cost-category-content') || content.classList.contains('cost-item-content'))) {
                 // Toggle (añadir/quitar) la clase 'active' en el contenido para mostrar/ocultar
                content.classList.toggle('active');

                // Cambia el icono +/- (opcional, basado en la clase)
                const icon = header.querySelector('.toggle-icon, .toggle-icon-item');
                if (icon) {
                    icon.textContent = header.classList.contains('active') ? '-' : '+';
                }
            }
        });
    });
});