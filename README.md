### Calculadora de Costos para Pastelería





## 📋 Descripción

La **Calculadora de Costos para Pastelería** es una herramienta web completa diseñada para ayudar a emprendedores pasteleros a calcular con precisión los costos de sus productos y establecer precios justos. Esta aplicación permite determinar el costo real de ingredientes, considerar gastos fijos, valorar el tiempo invertido y calcular márgenes de ganancia adecuados.

Desarrollada con HTML, CSS y JavaScript puro, esta calculadora no requiere frameworks ni dependencias externas, lo que la hace ligera, rápida y fácil de implementar en cualquier sitio web.

## ✨ Características Principales

- **Calculadora de Insumos**: Calcula el costo exacto de cada ingrediente utilizado en una receta.
- **Conversión Automática de Unidades**: Convierte entre diferentes unidades de medida (kg, g, oz, lt, ml, unidades).
- **Validación de Compatibilidad**: Asegura que solo se utilicen unidades compatibles entre sí.
- **Ejemplo Práctico Interactivo**: Calcula paso a paso el costo de una torta de chocolate, incluyendo:

- Ingredientes
- Costos de horneado (electricidad, amortización)
- Decoración
- Packaging
- Valoración del tiempo
- Precio final sugerido



- **Calculadora de Gastos Fijos**: Ayuda a distribuir los gastos fijos mensuales entre los productos.
- **Sección Educativa**: Explica diferentes estrategias de precios y conceptos importantes.
- **Diseño Responsivo**: Funciona perfectamente en dispositivos móviles, tablets y escritorio.
- **Interfaz Intuitiva**: Diseño amigable con tooltips informativos y explicaciones claras.


## 🛠️ Tecnologías Utilizadas

- **HTML5**: Estructura semántica y accesible.
- **CSS3**: Estilos modernos con variables CSS, flexbox y grid.
- **JavaScript**: Funcionalidades interactivas y cálculos dinámicos.
- **Fuentes Google**: Familia tipográfica Poppins.
- **SVG**: Iconos vectoriales ligeros.


## 📁 Estructura del Proyecto

```plaintext
calculadora-de-costos/
│
├── index.html          # Estructura principal y contenido
├── styles.css          # Estilos y diseño responsivo
├── script.js           # Funcionalidades y cálculos
└── README.md           # Documentación del proyecto
```

## 🚀 Instalación

1. **Clona el repositorio**:

```shellscript
git clone https://github.com/Excel-ente/como_calcular_el_costo_de_tus_recetas
```


2. **Instalación simple**:

1. No requiere instalación de dependencias ni configuración especial.
2. Simplemente abre el archivo `index.html` en tu navegador para comenzar a usar la calculadora.



3. **Implementación en servidor web**:

1. Sube los archivos a tu servidor web o servicio de hosting.
2. Asegúrate de mantener la estructura de archivos intacta.



## 📝 Guía de Uso

### Calculadora de Insumos

1. Ingresa el nombre del producto (ej: "Harina").
2. Ingresa el precio total de compra (ej: el costo del paquete completo).
3. Ingresa la cantidad comprada y selecciona la unidad (ej: 1 kg).
4. Ingresa la cantidad usada en la receta y selecciona la unidad (ej: 300 g).
5. La calculadora mostrará automáticamente el costo de la cantidad utilizada.


### Ejemplo Práctico de Torta

1. Navega por las pestañas para ver cada aspecto del cálculo:

1. **Ingredientes**: Agrega todos los ingredientes de tu receta.
2. **Horneado**: Calcula el costo de electricidad y amortización de equipos.
3. **Decoración**: Agrega elementos decorativos.
4. **Packaging**: Incluye cajas, etiquetas y otros elementos de presentación.
5. **Tu tiempo**: Valora el tiempo invertido en la preparación.
6. **Precio final**: Visualiza el desglose de costos y establece tu margen de ganancia.


### Calculadora de Gastos Fijos

1. Ingresa tus gastos fijos mensuales (alquiler, servicios, etc.).
2. Especifica la cantidad estimada de productos que elaboras al mes.
3. La calculadora te mostrará cuánto debes agregar a cada producto para cubrir estos gastos.


## 🎨 Personalización

### Cambiar Colores

El proyecto utiliza variables CSS que facilitan la personalización. Para cambiar la paleta de colores, modifica las variables en la sección `:root` del archivo `styles.css`:

```css
:root {
  --pink-500: #ec4899;  /* Color principal */
  --purple-700: #7e22ce;  /* Color secundario */
  /* Modifica los demás colores según tus preferencias */
}
```

### Agregar Nuevas Funcionalidades

Para agregar nuevas calculadoras o secciones:

1. Crea la estructura HTML en `index.html`.
2. Agrega los estilos correspondientes en `styles.css`.
3. Implementa la lógica en `script.js`.


Ejemplo para agregar una nueva sección:

```html
<section class="nueva-seccion">
  <div class="container">
    <h2>Título de la Nueva Sección</h2>
    <!-- Contenido de la nueva sección -->
  </div>
</section>
```

### Modificar Unidades de Medida

Para agregar o modificar unidades de medida, edita los siguientes objetos en `script.js`:

```javascript
// Conversiones entre unidades
const unitConversions = {
  // Añade nuevas conversiones aquí
  kg: { g: 35.274, oz: 1000 , /* nueva unidad: factor */ },
}

// Grupos de unidades compatibles
const unitGroups = {
  // Añade nuevos grupos o modifica los existentes
  weight: ["kg", "g", "oz", /* nueva unidad */],
}
```

## 🧪 Pruebas

Para asegurar el correcto funcionamiento de la calculadora:

1. **Prueba la calculadora de insumos**:

1. Verifica que las conversiones entre unidades sean correctas.
2. Comprueba que las validaciones de compatibilidad funcionen.



2. **Prueba el ejemplo de la torta**:

1. Navega por todas las pestañas y verifica los cálculos.
2. Añade y elimina elementos para comprobar que los totales se actualicen correctamente.



3. **Prueba la calculadora de gastos fijos**:

1. Verifica que los cálculos de distribución sean correctos.



4. **Prueba la responsividad**:

1. Comprueba que la aplicación se vea y funcione correctamente en diferentes dispositivos y tamaños de pantalla.





## 👥 Contribuciones

Las contribuciones son bienvenidas y apreciadas. Para contribuir:

1. Haz un fork del repositorio.
2. Crea una rama para tu funcionalidad (`git checkout -b feature/nueva-funcionalidad`).
3. Realiza tus cambios y haz commit (`git commit -m 'Añadir nueva funcionalidad'`).
4. Sube tus cambios (`git push origin feature/nueva-funcionalidad`).
5. Abre un Pull Request.


## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Consulta el archivo `LICENSE` para más detalles.

## 📞 Contacto

Para preguntas, sugerencias o colaboraciones:

- **Sitio Web**: [www.calculadoraderecetas.com](https://github.com/Excel-ente/como_calcular_el_costo_de_tus_recetas/)

---

## 🙏 Agradecimientos

- A todos los emprendedores pasteleros que inspiraron este proyecto.
- A la comunidad de desarrolladores por sus valiosos recursos y herramientas.


---

Desarrollado con ❤️ por EXCEL-ENTE | © 2025 Calculadora de Recetas
