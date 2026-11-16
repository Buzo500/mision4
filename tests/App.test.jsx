import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from '../src/App';
import { jsonResponse, registration, savedRegistration } from './fixtures';

const clients = [];

function renderApp(fetchMock) {
  vi.stubGlobal('fetch', fetchMock);
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 60_000 }, mutations: { retry: false } },
  });
  clients.push(client);
  render(<QueryClientProvider client={client}><App /></QueryClientProvider>);
  return userEvent.setup();
}

async function fillRegistration(user) {
  await user.type(screen.getByLabelText('Nombre del proyecto'), registration.projectName);
  await user.type(screen.getByLabelText('Persona de contacto'), registration.contactName);
  await user.type(screen.getByLabelText('Correo electrónico'), registration.email);
  await user.selectOptions(screen.getByLabelText('Categoría del proyecto'), registration.category);
  await user.type(screen.getByLabelText('¿Qué os gustaría crear?'), registration.description);
  await user.click(screen.getByLabelText('He leído y acepto las bases de participación.'));
}

afterEach(() => {
  clients.forEach((client) => client.clear());
  clients.length = 0;
});

describe('JamLink: formulario y listado conectados', () => {
  it('muestra carga mientras el listado espera una respuesta', async () => {
    let resolveList;
    renderApp(vi.fn().mockReturnValue(new Promise((resolve) => { resolveList = resolve; })));
    expect(screen.getByText('Cargando las inscripciones…')).toBeInTheDocument();
    await act(async () => resolveList(jsonResponse([])));
    expect(await screen.findByText('El primer proyecto puede ser el tuyo.')).toBeInTheDocument();
  });

  it('impide enviar un formulario vacío y enfoca el primer campo incorrecto', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse([]));
    const user = renderApp(fetchMock);
    await screen.findByText('El primer proyecto puede ser el tuyo.');
    await user.click(screen.getByRole('button', { name: 'Inscribir mi proyecto' }));
    expect(await screen.findByText('Escribe al menos 3 caracteres.')).toBeInTheDocument();
    expect(screen.getByText('Debes aceptar las bases para inscribirte.')).toBeInTheDocument();
    expect(screen.getByLabelText('Nombre del proyecto')).toHaveAttribute('aria-invalid', 'true');
    await waitFor(() => expect(screen.getByLabelText('Nombre del proyecto')).toHaveFocus());
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('muestra los errores de correo y de modalidad junto a los campos', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse([]));
    const user = renderApp(fetchMock);
    await fillRegistration(user);
    await user.clear(screen.getByLabelText('Correo electrónico'));
    await user.type(screen.getByLabelText('Correo electrónico'), 'correo-invalido');
    await user.selectOptions(screen.getByLabelText('Modalidad'), 'individual');
    await user.click(screen.getByRole('button', { name: 'Inscribir mi proyecto' }));
    expect(await screen.findByText('Introduce un correo válido.')).toBeInTheDocument();
    expect(screen.getByText('En modalidad individual debe haber 1 integrante.')).toBeInTheDocument();
    expect(fetchMock.mock.calls.every(([, options]) => options.method !== 'POST')).toBe(true);
  });

  it('crea con POST, vuelve a obtener el listado y limpia el formulario tras el éxito', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse([]))
      .mockResolvedValueOnce(jsonResponse(savedRegistration, 201))
      .mockResolvedValueOnce(jsonResponse([savedRegistration]));
    const user = renderApp(fetchMock);
    await screen.findByText('El primer proyecto puede ser el tuyo.');
    await fillRegistration(user);
    await user.click(screen.getByRole('button', { name: 'Inscribir mi proyecto' }));
    expect(await screen.findByText('¡Píxel Nómada ya está inscrito!')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: registration.projectName })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByLabelText('Nombre del proyecto')).toHaveValue(''));
    expect(screen.getByLabelText('He leído y acepto las bases de participación.')).not.toBeChecked();
    expect(fetchMock.mock.calls.map(([, options]) => options.method || 'GET')).toEqual(['GET', 'POST', 'GET']);
    expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toEqual(registration);
  });

  it.each(['editar', 'enviar vacío'])('retira el éxito anterior al %s una nueva inscripción', async (action) => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse([]))
      .mockResolvedValueOnce(jsonResponse(savedRegistration, 201))
      .mockResolvedValueOnce(jsonResponse([savedRegistration]));
    const user = renderApp(fetchMock);
    await fillRegistration(user);
    await user.click(screen.getByRole('button', { name: 'Inscribir mi proyecto' }));
    expect(await screen.findByText('¡Píxel Nómada ya está inscrito!')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByLabelText('Nombre del proyecto')).toHaveValue(''));

    if (action === 'editar') {
      await user.type(screen.getByLabelText('Nombre del proyecto'), 'Una idea nueva');
    } else {
      await user.click(screen.getByRole('button', { name: 'Inscribir mi proyecto' }));
      expect(await screen.findByText('Escribe al menos 3 caracteres.')).toBeInTheDocument();
    }

    expect(screen.queryByText('¡Píxel Nómada ya está inscrito!')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: registration.projectName })).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('deshabilita el envío mientras el POST está pendiente y evita un segundo alta', async () => {
    let finishPost;
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse([]))
      .mockImplementationOnce(() => new Promise((resolve) => { finishPost = resolve; }))
      .mockResolvedValueOnce(jsonResponse([savedRegistration]));
    const user = renderApp(fetchMock);
    await fillRegistration(user);
    await user.click(screen.getByRole('button', { name: 'Inscribir mi proyecto' }));
    const sendingButton = await screen.findByRole('button', { name: 'Guardando inscripción…' });
    expect(sendingButton).toBeDisabled();
    expect(screen.getByLabelText('Nombre del proyecto')).toBeDisabled();
    await user.click(sendingButton);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    await act(async () => finishPost(jsonResponse(savedRegistration, 201)));
    expect(await screen.findByText('¡Píxel Nómada ya está inscrito!')).toBeInTheDocument();
  });

  it('conserva los datos si falla el POST y permite volver a enviarlos', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse([]))
      .mockResolvedValueOnce(jsonResponse({}, 500))
      .mockResolvedValueOnce(jsonResponse(savedRegistration, 201))
      .mockResolvedValueOnce(jsonResponse([savedRegistration]));
    const user = renderApp(fetchMock);
    await fillRegistration(user);
    await user.click(screen.getByRole('button', { name: 'Inscribir mi proyecto' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('HTTP 500');
    expect(screen.getByLabelText('Nombre del proyecto')).toHaveValue(registration.projectName);
    expect(screen.getByLabelText('He leído y acepto las bases de participación.')).toBeChecked();
    await user.click(screen.getByRole('button', { name: 'Inscribir mi proyecto' }));
    expect(await screen.findByText('¡Píxel Nómada ya está inscrito!')).toBeInTheDocument();
  });

  it('permite reintentar una consulta fallida', async () => {
    const fetchMock = vi.fn()
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValueOnce(jsonResponse([savedRegistration]));
    const user = renderApp(fetchMock);
    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo conectar');
    await user.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(await screen.findByRole('heading', { name: registration.projectName })).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('filtra por categoría y explica cuándo no hay coincidencias', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse([savedRegistration]));
    const user = renderApp(fetchMock);
    await screen.findByRole('heading', { name: registration.projectName });
    await user.selectOptions(screen.getByLabelText('Filtrar por categoría'), 'Sonido y música');
    expect(screen.getByText('Todavía no hay proyectos de esta categoría.')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: registration.projectName })).not.toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText('Filtrar por categoría'), '');
    expect(screen.getByRole('heading', { name: registration.projectName })).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('rechaza un listado corrupto sin renderizar sus tarjetas', async () => {
    renderApp(vi.fn().mockResolvedValue(jsonResponse([{ ...savedRegistration, members: '3' }])));
    expect(await screen.findByRole('alert')).toHaveTextContent('0.members');
    expect(screen.queryByRole('heading', { name: registration.projectName })).not.toBeInTheDocument();
  });
});

describe('Bonus: respuesta incorrecta de una API', () => {
  async function openDemo(user) {
    await user.click(screen.getByText('Demo de clase · Validar también la respuesta de la API'));
    await user.click(screen.getByRole('button', { name: 'Probar respuesta corrupta' }));
  }

  it('detecta el campo incorrecto y no modifica el listado de inscripciones', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse([savedRegistration]))
      .mockResolvedValueOnce(jsonResponse([{ ...savedRegistration, members: 'tres' }]));
    const user = renderApp(fetchMock);
    await screen.findByRole('heading', { name: registration.projectName });
    await openDemo(user);
    expect(await screen.findByText(/Bonus demostrado: Zod ha rechazado el dato corrupto/)).toHaveTextContent('0.members');
    const list = screen.getByRole('list');
    expect(within(list).getAllByRole('listitem')).toHaveLength(1);
    expect(within(list).getByText('Equipo · 2 personas')).toBeInTheDocument();
    expect(fetchMock.mock.calls[1][0]).toBe('https://jamlink.test/demo');
  });

  it('no confunde un fallo de red con un bonus superado', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse([]))
      .mockRejectedValueOnce(new TypeError('Failed to fetch'));
    const user = renderApp(fetchMock);
    await screen.findByText('El primer proyecto puede ser el tuyo.');
    await openDemo(user);
    expect(await screen.findByRole('alert')).toHaveTextContent('No se ha podido completar la prueba');
    expect(screen.queryByText(/Bonus demostrado/)).not.toBeInTheDocument();
  });

  it('no anuncia dato corrupto si la respuesta de demostración es válida', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse([]))
      .mockResolvedValueOnce(jsonResponse([savedRegistration]));
    const user = renderApp(fetchMock);
    await screen.findByText('El primer proyecto puede ser el tuyo.');
    await openDemo(user);
    expect(await screen.findByText(/La respuesta es válida/)).toBeInTheDocument();
    expect(screen.queryByText(/Bonus demostrado/)).not.toBeInTheDocument();
  });
});
