import { beforeEach, describe, expect, it, vi } from 'vitest';
import { jsonResponse, registration, savedRegistration } from './fixtures';

let api;
let fetchMock;

beforeEach(async () => {
  vi.resetModules();
  vi.stubEnv('VITE_API_URL', 'https://jamlink.test/inscripciones/');
  vi.stubEnv('VITE_DEMO_API_URL', 'https://jamlink.test/demo/');
  fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
  api = await import('../src/api/registrations');
});

describe('Peticiones y validación de la API', () => {
  it('acepta un listado vacío y utiliza una señal de cancelación', async () => {
    fetchMock.mockResolvedValue(jsonResponse([]));
    const controller = new AbortController();
    await expect(api.getRegistrations({ signal: controller.signal })).resolves.toEqual([]);
    expect(fetchMock).toHaveBeenCalledWith('https://jamlink.test/inscripciones', { signal: expect.any(AbortSignal) });
  });

  it('obtiene y valida las inscripciones recibidas', async () => {
    fetchMock.mockResolvedValue(jsonResponse([savedRegistration]));
    await expect(api.getRegistrations()).resolves.toEqual([savedRegistration]);
  });

  it.each([404, 500])('rechaza una respuesta HTTP %i aunque fetch resuelva', async (status) => {
    fetchMock.mockResolvedValue(jsonResponse({ message: 'Error' }, status));
    await expect(api.getRegistrations()).rejects.toThrow(`HTTP ${status}`);
  });

  it('muestra un error comprensible cuando la red falla', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));
    await expect(api.getRegistrations()).rejects.toThrow('No se pudo conectar con la API');
  });

  it('mantiene el error de cancelación para que Query cancele correctamente', async () => {
    const abort = new DOMException('Cancelada', 'AbortError');
    fetchMock.mockRejectedValue(abort);
    await expect(api.getRegistrations()).rejects.toBe(abort);
  });

  it('cancela la petición cuando Query aborta su señal original', async () => {
    const controller = new AbortController();
    fetchMock.mockImplementation((url, { signal }) => new Promise((resolve, reject) => {
      signal.addEventListener('abort', () => reject(signal.reason), { once: true });
    }));
    const request = api.getRegistrations({ signal: controller.signal });
    const assertion = expect(request).rejects.toMatchObject({ name: 'AbortError' });
    controller.abort();
    await assertion;
    expect(fetchMock.mock.calls[0][1].signal.aborted).toBe(true);
  });

  it('limita la espera a 15 segundos y explica qué hacer si vence el plazo', async () => {
    const timeoutController = new AbortController();
    const timeoutSpy = vi.spyOn(AbortSignal, 'timeout').mockReturnValue(timeoutController.signal);
    fetchMock.mockImplementation((url, { signal }) => new Promise((resolve, reject) => {
      signal.addEventListener('abort', () => reject(signal.reason), { once: true });
    }));
    const request = api.createRegistration(registration);
    const assertion = expect(request).rejects.toThrow('La API ha tardado demasiado. Actualiza el listado antes de volver a enviar.');
    timeoutController.abort(new DOMException('Tiempo agotado', 'TimeoutError'));
    await assertion;
    expect(timeoutSpy).toHaveBeenCalledWith(15_000);
  });

  it('distingue JSON ilegible de un fallo de red', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => { throw new SyntaxError('Malformed JSON'); } });
    await expect(api.getRegistrations()).rejects.toThrow('JSON válido');
  });

  it('rechaza registros corruptos y señala el campo afectado', async () => {
    fetchMock.mockResolvedValue(jsonResponse([{ ...savedRegistration, members: 'tres' }]));
    await expect(api.getRegistrations()).rejects.toMatchObject({
      name: 'InvalidApiResponseError',
      message: expect.stringContaining('0.members'),
    });
  });

  it('envía un POST JSON y comprueba la inscripción devuelta', async () => {
    fetchMock.mockResolvedValue(jsonResponse(savedRegistration, 201));
    await expect(api.createRegistration(registration)).resolves.toEqual(savedRegistration);
    expect(fetchMock).toHaveBeenCalledWith('https://jamlink.test/inscripciones', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(registration),
      signal: expect.any(AbortSignal),
    });
  });

  it('no acepta un POST exitoso cuya respuesta no tenga identificador', async () => {
    fetchMock.mockResolvedValue(jsonResponse(registration, 201));
    await expect(api.createRegistration(registration)).rejects.toMatchObject({ name: 'InvalidApiResponseError' });
  });

  it('consulta un recurso separado para el bonus y aplica el mismo contrato', async () => {
    fetchMock.mockResolvedValue(jsonResponse([{ ...savedRegistration, members: 'tres' }]));
    await expect(api.getCorruptDemo()).rejects.toMatchObject({ name: 'InvalidApiResponseError' });
    expect(fetchMock).toHaveBeenCalledWith('https://jamlink.test/demo', { signal: expect.any(AbortSignal) });
  });

  it('explica cómo configurar una URL ausente sin hacer peticiones', async () => {
    vi.stubEnv('VITE_API_URL', '');
    vi.resetModules();
    const unconfiguredApi = await import('../src/api/registrations');
    await expect(unconfiguredApi.getRegistrations()).rejects.toThrow('Falta configurar la URL');
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
