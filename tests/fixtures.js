export const registration = {
  projectName: 'Píxel Nómada',
  contactName: 'Alex Prueba',
  email: 'alex@example.com',
  mode: 'equipo',
  members: 2,
  category: 'Videojuegos',
  description: 'Un juego cooperativo para explorar un planeta desconocido.',
  acceptRules: true,
};

export const savedRegistration = { ...registration, id: '1' };

export function jsonResponse(data, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => data,
  };
}
