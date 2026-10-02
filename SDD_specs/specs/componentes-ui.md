# Componentes UI

## Propósito

Permite insertar bloques de interfaz reutilizables desde una biblioteca visual y tratarlos como grupos editables en el lienzo.

## Comportamiento principal

- La pestaña Componentes y la colección "UI software" del panel lateral izquierdo ofrecen Button, Input, Textarea, Checkbox, Toggle, Card, Avatar, Navbar, Sidebar, Table, Image y Modal.
- Un menú superior "Archivo"
- Cada elemento de la biblioteca se arrastra al lienzo; la posición de soltar se convierte a coordenadas del documento y el componente queda seleccionado.
- El componente se guarda como un grupo con nombre, caja propia, clase CSS inicial y uno o más elementos hijos que representan su superficie y textos.
- Las paletas de creación cambian según el tema actual y suministran colores iniciales para fondo, borde y texto de cada componente.
- Cada componente conserva una composición visual propia en el canvas: controles redondeados, líneas de texto, interruptor con mando, avatar circular, navegación, menú lateral, tabla, imagen y modal con cabecera.
- Los grupos pueden moverse, redimensionarse, bloquearse, ordenarse, copiarse y exportarse usando las operaciones generales del editor.

## Criterios de aceptación

- Soltar un componente válido crea el grupo y sus hijos en el documento sin perder la posición de destino.
- El grupo se representa como una unidad seleccionable y conserva su nombre, hijos y clase CSS.
- Crear el mismo tipo en modo claro u oscuro aplica la paleta correspondiente en sus elementos iniciales.

## Evidencia de código

- `app/index.html`
- `app/js/model/components.js`
- `app/js/ui/ui.js`
