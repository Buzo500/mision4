# JamLink

Misión M4 · React Hook Form, Zod y TanStack Query

Aplicación para inscribirse en una game jam universitaria y consultar los proyectos participantes. Permite registrar un proyecto individual o un equipo de entre 2 y 4 personas, validar los datos del formulario y filtrar las inscripciones por categoría. Los datos se guardan en MockAPI y siguen disponibles al recargar la página.

## Cómo probarlo

Con Node.js 22.12 o posterior y conexión a Internet, ejecutar desde la carpeta del proyecto:

```sh
npm ci
```

Si todavía no existe `.env`, copiar `.env.example` a `.env`. En PowerShell:

```powershell
Copy-Item .env.example .env
```

El archivo de ejemplo ya contiene las URL de las colecciones `inscripciones` y `demo` de MockAPI, en las variables `VITE_API_URL` y `VITE_DEMO_API_URL`. Si se cambian, hay que reiniciar Vite.

```sh
npm run dev
```

Abrir [http://127.0.0.1:5174](http://127.0.0.1:5174). El puerto es fijo: si está ocupado, hay que liberarlo antes de arrancar la aplicación.

Para comprobar las funciones principales:

1. Enviar el formulario vacío y comprobar que aparecen errores junto a los campos y que el foco pasa al primer campo incorrecto.
2. Elegir la modalidad individual y poner 2 integrantes. Debe aparecer un error: individual exige 1 persona y equipo permite entre 2 y 4.
3. Completar una inscripción con datos ficticios, una descripción de al menos 20 caracteres y las bases aceptadas. Al enviarla, debe aparecer la confirmación, limpiarse el formulario y actualizarse el listado y los contadores.
4. Filtrar los proyectos por categoría y pulsar «Actualizar» para volver a consultar las inscripciones.
5. Recargar la página: el proyecto debe seguir disponible porque está guardado en MockAPI.
6. Abrir «Demo de clase · Validar también la respuesta de la API» y pulsar «Probar respuesta corrupta». Zod debe rechazar el valor `members: "tres"` e indicar el campo afectado. La demo consulta una colección separada y no modifica las inscripciones.

La API es pública: utilizar datos ficticios, incluido el correo, aunque este no se muestre en las tarjetas.

Para ejecutar las comprobaciones automáticas:

```sh
npm run check
```

Este comando ejecuta ESLint, las 72 pruebas y la compilación de producción. Las pruebas cubren las reglas del formulario, la relación entre modalidad e integrantes, la validación de respuestas, los errores de conexión, el envío, los reintentos, los filtros y la gestión del foco. Utilizan respuestas simuladas; la persistencia real se comprueba con los pasos anteriores.

## Uso de IA

Utilicé Codex de chatgpt para preguntar como podría estructurar el programa.

1. "Dame la estructura sin escribir código de este practica"

2. "Qué API me recomiendas?"


## Autopsia

1. **Centralizar la validación en Zod.** Las reglas están en un único esquema que se conecta al formulario con `zodResolver` y se reutiliza para comprobar las respuestas de la API con `safeParse`. Así se valida tanto cada campo como la relación entre modalidad e integrantes. Esta solución evita repetir las reglas en cada input o confiar directamente en los datos del servidor. Como contrapartida, un solo registro incorrecto hace fallar la validación del listado completo, aunque los demás sean válidos.

2. **Guardar en MockAPI y volver a consultar después del envío.** La inscripción se envía con `mutateAsync` y, cuando se guarda correctamente, `invalidateQueries` solicita de nuevo el listado. El formulario se limpia al terminar; si el envío falla, conserva los campos. Esto permite recuperar las inscripciones al recargar y mostrar los datos confirmados por la API. Frente a guardarlas en `localStorage` o añadirlas directamente al listado antes de recibir la respuesta, la contrapartida es depender de la conexión y realizar una consulta adicional después de cada alta.
