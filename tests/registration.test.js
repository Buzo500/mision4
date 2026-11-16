import { describe, expect, it } from 'vitest';
import {
  apiRegistrationSchema,
  registrationListSchema,
  registrationSchema,
} from '../src/schemas/registration.js';

const validRegistration = {
  projectName: 'Píxel Nómada',
  contactName: 'Ana Ejemplo',
  email: 'ana@example.com',
  mode: 'equipo',
  members: 2,
  category: 'Videojuegos',
  description: 'Un juego de plataformas ambientado en el espacio.',
  acceptRules: true,
};

describe('Reglas de inscripción', () => {
  it.each([
    ['individual', 1],
    ['equipo', 2],
    ['equipo', 3],
    ['equipo', 4],
  ])('admite la modalidad %s con %i integrantes', (mode, members) => {
    expect(registrationSchema.safeParse({ ...validRegistration, mode, members }).success).toBe(true);
  });

  it.each([
    ['individual', 2],
    ['equipo', 1],
    ['equipo', 0],
    ['equipo', 5],
    ['equipo', 2.5],
    ['equipo', Number.NaN],
  ])('rechaza la modalidad %s con %s integrantes y señala el campo', (mode, members) => {
    const result = registrationSchema.safeParse({ ...validRegistration, mode, members });
    expect(result.success).toBe(false);
    expect(result.error.issues.some((issue) => issue.path[0] === 'members')).toBe(true);
  });

  it.each([
    ['projectName', ''],
    ['projectName', '   '],
    ['contactName', ''],
    ['email', ''],
    ['email', 'correo-sin-arroba'],
    ['mode', 'otra'],
    ['category', ''],
    ['category', 'Categoría inventada'],
    ['description', ''],
    ['acceptRules', false],
  ])('rechaza un valor inválido en %s: %s', (field, value) => {
    const result = registrationSchema.safeParse({ ...validRegistration, [field]: value });
    expect(result.success).toBe(false);
    expect(result.error.issues.some((issue) => issue.path[0] === field)).toBe(true);
  });

  it('exige todas las propiedades obligatorias', () => {
    const result = registrationSchema.safeParse({});
    expect(result.success).toBe(false);
    expect(new Set(result.error.issues.map((issue) => issue.path[0]))).toEqual(
      new Set(Object.keys(validRegistration)),
    );
  });

  it('recorta espacios y normaliza el correo antes del envío', () => {
    const result = registrationSchema.parse({
      ...validRegistration,
      projectName: '  Píxel Nómada  ',
      contactName: '  Ana Ejemplo  ',
      email: '  ANA@EXAMPLE.COM  ',
      description: `  ${validRegistration.description}  `,
    });
    expect(result).toEqual(validRegistration);
  });

  it.each([
    ['projectName', 2, false],
    ['projectName', 3, true],
    ['projectName', 40, true],
    ['projectName', 41, false],
    ['contactName', 1, false],
    ['contactName', 2, true],
    ['contactName', 60, true],
    ['contactName', 61, false],
    ['description', 19, false],
    ['description', 20, true],
    ['description', 300, true],
    ['description', 301, false],
  ])('comprueba %s de longitud %i', (field, length, expected) => {
    expect(registrationSchema.safeParse({
      ...validRegistration,
      [field]: 'a'.repeat(length),
    }).success).toBe(expected);
  });
});

describe('Contrato de las respuestas de la API', () => {
  it('admite una inscripción válida con identificador', () => {
    expect(apiRegistrationSchema.safeParse({ ...validRegistration, id: '1' }).success).toBe(true);
  });

  it.each(['3', 'tres'])('rechaza integrantes de tipo texto: %s', (members) => {
    const result = apiRegistrationSchema.safeParse({ ...validRegistration, id: '1', members });
    expect(result.success).toBe(false);
    expect(result.error.issues[0].path).toEqual(['members']);
  });

  it.each(['', undefined, 1])('rechaza un identificador inválido: %s', (id) => {
    expect(apiRegistrationSchema.safeParse({ ...validRegistration, id }).success).toBe(false);
  });

  it('mantiene las reglas entre modalidad e integrantes en las respuestas', () => {
    expect(apiRegistrationSchema.safeParse({
      ...validRegistration,
      id: '1',
      mode: 'individual',
      members: 3,
    }).success).toBe(false);
  });

  it('admite un listado vacío y un listado de inscripciones válidas', () => {
    expect(registrationListSchema.parse([])).toEqual([]);
    expect(registrationListSchema.parse([{ ...validRegistration, id: '1' }])).toHaveLength(1);
  });

  it('rechaza un objeto en lugar de un array', () => {
    expect(registrationListSchema.safeParse({ ...validRegistration, id: '1' }).success).toBe(false);
  });

  it('señala el registro y campo corruptos dentro del listado', () => {
    const result = registrationListSchema.safeParse([
      { ...validRegistration, id: '1' },
      { ...validRegistration, id: '2', members: 'tres' },
    ]);
    expect(result.success).toBe(false);
    expect(result.error.issues[0].path).toEqual([1, 'members']);
  });
});
