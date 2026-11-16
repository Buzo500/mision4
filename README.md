# JamLink · Misión 4

JamLink es una aplicación para inscribirse en una game jam universitaria y consultar los proyectos participantes. El formulario se gestiona con React Hook Form, Zod valida los datos y TanStack Query se encarga de las peticiones a MockAPI.

Las inscripciones se guardan en una API externa y siguen disponibles al recargar la página. No se usa `localStorage` ni hace falta arrancar un servidor propio.

## Puesta en marcha

Requisitos: Node.js 22.12 o superior y conexión a Internet para acceder a MockAPI.

Desde la carpeta `mision4`:

```bash
npm ci
```

Si todavía no existe `.env`, copia `.env.example` a `.env`. En PowerShell:

```powershell
Copy-Item .env.example .env
```

Comprueba que `.env` contiene las dos URL del proyecto de MockAPI:

```dotenv
VITE_API_URL=https://<id-del-proyecto>.mockapi.io/inscripciones
VITE_DEMO_API_URL=https://<id-del-proyecto>.mockapi.io/demo
```

Las URL deben apuntar a cada colección, sin añadir el identificador de un registro. Si `.env.example` ya contiene las URL configuradas, se pueden conservar. Si cambias `.env` mientras Vite está abierto, reinicia el servidor.

```bash
npm run dev
```

Abre [http://127.0.0.1:5174](http://127.0.0.1:5174). El puerto es fijo: si está ocupado, Vite avisa y no abre la aplicación en otro puerto.

## Qué permite hacer

- Inscribir un proyecto individual o un equipo de entre 2 y 4 personas.
- Ver los errores junto a los campos y conservar los datos si falla el envío.
- Consultar las inscripciones, filtrarlas por categoría y actualizar el listado.
- Ver el número de proyectos y participantes.
- Demostrar que Zod detecta una respuesta corrupta de la API.

El diseño se adapta a móvil. Los campos tienen etiquetas, los errores se relacionan con su campo mediante `aria-describedby` y se usa `aria-invalid`. Los mensajes de resultado utilizan `role="status"` o `role="alert"`.

## Tecnologías

| Tecnología | Uso |
| --- | --- |
| React 19 y Vite 8 | Componentes y entorno de desarrollo |
| JavaScript y CSS | Lógica y estilos, sin TypeScript ni biblioteca de componentes |
| React Hook Form | Registro de campos y gestión del formulario |
| Zod 4 y `@hookform/resolvers` | Reglas de validación y conexión con el formulario |
| TanStack Query 5 | Consulta, creación, caché e invalidación |
| MockAPI | API remota con persistencia |
| Vitest y Testing Library | Pruebas automáticas |
| ESLint | Revisión del código |

Las versiones concretas están en `package.json` y `package-lock.json`.

## Cómo funciona

1. `main.jsx` crea un `QueryClient` y lo comparte mediante `QueryClientProvider`.
2. `App.jsx` carga las inscripciones con `useQuery` y la clave `['registrations']`.
3. `RegistrationForm.jsx` registra los campos con `register`. Al enviar, `handleSubmit` llama al resolver de Zod y solo continúa si el formulario es válido.
4. `mutateAsync` ejecuta un `POST`. La función de la API comprueba el estado HTTP, lee el JSON y valida también la respuesta.
5. Si todo sale bien, `onSuccess` invalida `['registrations']`: se consulta otra vez el servidor para mostrar la inscripción guardada. Después se limpia el formulario con `reset`.
6. Si el envío falla, se muestra el error y se conservan los campos.

El filtro por categoría es local porque ya se ha descargado el listado completo. No necesita otra consulta ni una clave de caché diferente. Los datos se consideran frescos durante 60 segundos. Los reintentos automáticos están desactivados; la interfaz permite volver a intentarlo. `networkMode: 'always'` hace que también se intente la petición sin conexión y se muestre el error de `fetch`, sin dejarla pausada. La espera se limita a 15 segundos con `AbortSignal.timeout`; `AbortSignal.any` conserva también la cancelación de TanStack Query.

`watch('mode')` se utiliza únicamente para cambiar la ayuda del campo de integrantes. Cambiar la modalidad no modifica ese número automáticamente: la relación se comprueba en el esquema.

Las herramientas de desarrollo de TanStack Query están disponibles al ejecutar `npm run dev` y no se incluyen en la interfaz de producción.

## Validación en un único lugar

Todas las reglas están en `src/schemas/registration.js`. Los campos no repiten esas reglas dentro de `register`. El formulario lleva `noValidate` para que los mensajes procedan de Zod.

| Campo | Regla |
| --- | --- |
| `projectName` | Entre 3 y 40 caracteres, sin contar los espacios de los extremos |
| `contactName` | Entre 2 y 60 caracteres |
| `email` | Correo válido; se eliminan espacios exteriores y se pasa a minúsculas |
| `mode` | `individual` o `equipo` |
| `members` | Número entero entre 1 y 4 |
| `category` | `Videojuegos`, `Arte y diseño` o `Sonido y música` |
| `description` | Entre 20 y 300 caracteres |
| `acceptRules` | Debe ser `true` |

Además, dos llamadas a `refine` comprueban la relación entre modalidad e integrantes: individual exige exactamente 1; equipo exige entre 2 y 4. El error se asocia al campo `members`.

`valueAsNumber` convierte el valor del input numérico antes de validarlo. No añade una regla de validación. En las respuestas de la API no se convierten los tipos: tanto `"tres"` como `"3"` se rechazan si aparecen en `members`.

El esquema de una inscripción de la API se obtiene con `safeExtend`, que añade un `id` de tipo texto y conserva las reglas del formulario. El listado es un array de ese esquema.

## Bonus: detectar un dato corrupto

La función `validateResponse` aplica `safeParse` tanto al `GET` del listado como a la respuesta del `POST`. Si los datos no cumplen el esquema, lanza un error con el campo afectado. Esos datos no se aceptan como resultado correcto de la consulta.

La demostración usa una colección remota separada llamada `demo`, con una inscripción cuyo campo `members` contiene `"tres"`.

Para mostrarlo en clase:

1. Abre «Demo de clase · Validar también la respuesta de la API» debajo de los paneles.
2. Pulsa «Probar respuesta corrupta».
3. Se realiza un `GET` a la URL de demostración y se ejecuta la misma validación del listado normal.
4. La interfaz confirma que Zod ha rechazado el dato y muestra el campo afectado, por ejemplo `0.members`.

La consulta usa la clave `['demo', 'corrupt-response']` y `enabled: false`, por lo que solo se ejecuta al pulsar el botón. No escribe datos ni modifica las inscripciones. Un fallo de conexión se muestra como fallo de la prueba, no como detección de un dato corrupto.

## Configurar otro proyecto de MockAPI

Si necesitas usar tu propia cuenta, crea un proyecto con estas dos colecciones. La aplicación espera las respuestas JSON habituales de MockAPI: un array en el `GET` de una colección y un objeto en el `POST`.

Los recursos del proyecto entregado solo necesitan el `id` automático en el generador de MockAPI: el servicio conserva las demás propiedades que enviamos por `POST`. Estas son las propiedades que usa la aplicación; también puedes definirlas explícitamente si creas otro recurso:

| Propiedad | Tipo |
| --- | --- |
| `id` | Identificador de texto generado por MockAPI |
| `projectName` | String |
| `contactName` | String |
| `email` | String |
| `mode` | String |
| `members` | Number |
| `category` | String |
| `description` | String |
| `acceptRules` | Boolean |

La colección puede empezar vacía. Si añades datos iniciales, deben cumplir las reglas del esquema; los valores aleatorios generados por MockAPI pueden no cumplirlas.

En `demo`, utiliza las mismas propiedades, pero envía `members` como **String**. Si has definido un esquema de generación, usa String para ese campo. Añade un registro como este; MockAPI asigna el `id`:

```json
{
  "projectName": "Proyecto de prueba",
  "contactName": "Ana Ejemplo",
  "email": "ana@example.com",
  "mode": "equipo",
  "members": "tres",
  "category": "Videojuegos",
  "description": "Un juego de plataformas para demostrar la validación.",
  "acceptRules": true
}
```

El único dato incorrecto debe ser `members`. Guarda las URL de ambas colecciones en `.env` y reinicia Vite.

Este es un prototipo educativo con API pública: utiliza datos ficticios. Ocultar el correo en las tarjetas no lo convierte en privado, porque la API lo devuelve. No hay autenticación ni validación propia en un servidor; la validación del cliente no impide peticiones hechas desde fuera de la aplicación. Las variables `VITE_` son visibles en el navegador y no deben contener secretos.

## Estructura

```text
src/
  main.jsx                       Proveedores y herramientas de desarrollo
  App.jsx                        Consultas, mutación, filtro y contadores
  styles.css                     Estilos y adaptación a móvil
  api/registrations.js           Peticiones HTTP y validación de respuestas
  schemas/registration.js        Reglas Zod y categorías
  components/
    RegistrationForm.jsx        Formulario y errores de campos
    RegistrationList.jsx        Listado, filtro y estados
    BonusDemo.jsx               Prueba del dato corrupto
tests/                           Pruebas automáticas
.env.example                     Configuración que se puede copiar
DECLARACION_IA.md                 Uso de IA en el proyecto
```

## Comprobaciones

```bash
npm run check
```

Este comando ejecuta ESLint, las pruebas y la compilación. También se pueden ejecutar por separado:

```bash
npm run lint
npm test
npm run build
```

Para abrir la versión compilada, después de `npm run build`:

```bash
npm run preview
```

Estará disponible en [http://127.0.0.1:4174](http://127.0.0.1:4174). La compilación toma las URL del entorno en ese momento; si las cambias, vuelve a compilar.

Las pruebas automáticas permiten comprobar reglas y comportamientos sin depender de la disponibilidad del servicio externo. La conexión y la persistencia reales se comprueban también desde el navegador.

Comprobaciones realizadas el 16 de noviembre de 2026: **72 pruebas automáticas superadas**, ESLint sin errores y compilación correcta. En Chrome se comprobó el formulario vacío, una inscripción real con datos ficticios, la actualización del listado, la persistencia al recargar, el filtro sin resultados y el rechazo del dato corrupto remoto. También se revisó la vista de 390 px, sin desbordamiento horizontal, y no se observaron errores en la consola.

El archivo `.github/workflows/checks.yml` ejecutará `npm run check` en GitHub cuando se publique un commit o una pull request. Esa ejecución remota todavía no forma parte de las comprobaciones anteriores.

### Pruebas manuales para la presentación

| Prueba | Resultado esperado |
| --- | --- |
| Enviar sin rellenar el formulario | Errores junto a los campos y foco en el primer campo inválido |
| Escribir un correo incorrecto o una descripción de menos de 20 caracteres | Mensaje específico; no se envía el formulario |
| Elegir individual y poner 2 integrantes | Error en integrantes |
| Elegir equipo y poner 1, 5 o 2,5 integrantes | Error en integrantes |
| No aceptar las bases | Error de aceptación |
| Enviar una inscripción válida con datos ficticios | Botón de envío deshabilitado mientras se guarda, confirmación, formulario limpio y listado actualizado |
| Recargar la página después de inscribir | El proyecto sigue en el listado porque está guardado en MockAPI |
| Cambiar la categoría del filtro | Solo se muestran las inscripciones de esa categoría |
| Elegir una categoría sin inscripciones | Mensaje de listado vacío para esa categoría |
| Usar una conexión lenta desde las herramientas del navegador | Se distinguen la carga inicial y la actualización del listado |
| Bloquear temporalmente la URL de MockAPI desde las herramientas del navegador y consultar o enviar | Error visible; al fallar un envío se conservan los campos |
| Quitar el bloqueo y pulsar Actualizar o Reintentar | Se vuelve a solicitar el listado |
| Ejecutar la demostración del bonus | Se detecta `members: "tres"` sin alterar las inscripciones |

## Relación con la rúbrica

| Apartado | Puntos | Dónde se trabaja |
| --- | ---: | --- |
| React Hook Form | 20 | `RegistrationForm.jsx`: `register`, `handleSubmit`, errores, campos no controlados y accesibilidad |
| Validación con Zod | 15 | `registration.js`: esquema único, mensajes propios, refinamientos y `zodResolver` |
| TanStack Query | 15 | `main.jsx` y `App.jsx`: proveedor, consultas, mutación, claves e invalidación |
| Experiencia de usuario | 10 | Carga, error, éxito, reintento, conservación de campos y diseño responsive |
| Originalidad | 10 | Inscripción a una game jam, reglas de equipo, categorías y contadores |
| Checks automáticos y entrega | 30 | README, declaración de IA, scripts de comprobación, estructura, archivos ignorados e historial del repositorio |
| Bonus | Extra | Validación de respuestas con `safeParse` y demostración mediante una respuesta remota corrupta |

Esta tabla relaciona el proyecto con la rúbrica visible. No presupone el contenido de los checks privados del profesor ni garantiza una calificación.

Se conserva el repositorio del proyecto. `node_modules`, `dist` y los archivos de configuración local `.env` no deben subirse; sí se incluyen `package-lock.json` y `.env.example`.

## Guion de explicación: unos 6 minutos

1. **0:00–0:40 · Qué hace.** Mostrar formulario, listado y filtro. Explicar que se guardan inscripciones en MockAPI.
2. **0:40–1:40 · React Hook Form.** Enseñar `useForm`, `register`, `handleSubmit`, `errors` y `reset`. Aclarar que no se guarda cada input con `useState`.
3. **1:40–2:40 · Zod.** Mostrar las reglas y los dos `refine`. Probar individual con 2 integrantes para enseñar un error entre campos.
4. **2:40–4:00 · Peticiones.** Mostrar `useQuery`, `useMutation` y la invalidación. Crear una inscripción ficticia, comprobar el listado y recargar.
5. **4:00–5:00 · Bonus.** Explicar `safeParse` y pulsar el botón de la respuesta corrupta. Señalar que la demo consulta otro recurso y no modifica el listado.
6. **5:00–6:00 · Entrega.** Mostrar los comandos de comprobación, la estructura y la declaración de IA. Explicar el límite del prototipo: API pública y datos ficticios.
