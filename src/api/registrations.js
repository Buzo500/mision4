import { apiRegistrationSchema, registrationListSchema } from '../schemas/registration';

const apiUrl = import.meta.env.VITE_API_URL?.replace(/\/$/, '');
const demoUrl = import.meta.env.VITE_DEMO_API_URL?.replace(/\/$/, '');

// Compartimos esta comprobación en GET, POST y la demostración del bonus.
export function validateResponse(schema, data) {
  const result = schema.safeParse(data);
  if (!result.success) {
    const field = result.error.issues[0].path.join('.') || 'respuesta';
    const error = new Error(`La API ha devuelto datos no válidos (campo: ${field}).`);
    error.name = 'InvalidApiResponseError';
    throw error;
  }
  return result.data;
}

async function request(url, options = {}) {
  if (!url) throw new Error('Falta configurar la URL de la API en el archivo .env. Consulta el README.');

  let response;
  try {
    // Respetamos la cancelación de Query y limitamos la espera a 15 segundos.
    const signal = AbortSignal.any([options.signal, AbortSignal.timeout(15_000)].filter(Boolean));
    response = await fetch(url, { ...options, signal });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    if (error.name === 'TimeoutError') {
      throw new Error('La API ha tardado demasiado. Actualiza el listado antes de volver a enviar.', { cause: error });
    }
    throw new Error('No se pudo conectar con la API. Comprueba tu conexión y vuelve a intentarlo.', { cause: error });
  }
  if (!response.ok) throw new Error(`La API no pudo completar la petición (HTTP ${response.status}).`);

  try {
    return await response.json();
  } catch {
    throw new Error('La API no ha devuelto un JSON válido.');
  }
}

export async function getRegistrations({ signal } = {}) {
  const data = await request(apiUrl, { signal });
  return validateResponse(registrationListSchema, data);
}

export async function createRegistration(registration) {
  const data = await request(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(registration),
  });
  return validateResponse(apiRegistrationSchema, data);
}

export async function getCorruptDemo({ signal } = {}) {
  const data = await request(demoUrl, { signal });
  return validateResponse(registrationListSchema, data);
}
