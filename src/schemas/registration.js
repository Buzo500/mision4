import { z } from 'zod';

export const categories = ['Videojuegos', 'Arte y diseño', 'Sonido y música'];

// Todas las reglas del formulario viven aquí, incluidas las que relacionan campos.
export const registrationSchema = z.object({
  projectName: z.string().trim().min(3, 'Escribe al menos 3 caracteres.').max(40, 'Máximo 40 caracteres.'),
  contactName: z.string().trim().min(2, 'Escribe el nombre del responsable.').max(60, 'Máximo 60 caracteres.'),
  email: z.string().trim().toLowerCase().pipe(z.email('Introduce un correo válido.')),
  mode: z.enum(['individual', 'equipo'], { error: 'Elige una modalidad.' }),
  members: z.number({ error: 'Introduce un número de integrantes.' }).int('Usa un número entero.').min(1, 'Debe haber al menos 1 integrante.').max(4, 'El máximo es de 4 integrantes.'),
  category: z.enum(categories, { error: 'Elige una categoría.' }),
  description: z.string().trim().min(20, 'Describe tu idea en al menos 20 caracteres.').max(300, 'Máximo 300 caracteres.'),
  acceptRules: z.literal(true, { error: 'Debes aceptar las bases para inscribirte.' }),
}).refine(
  (data) => data.mode !== 'individual' || data.members === 1,
  { path: ['members'], message: 'En modalidad individual debe haber 1 integrante.' },
).refine(
  (data) => data.mode !== 'equipo' || data.members >= 2,
  { path: ['members'], message: 'En modalidad equipo debe haber entre 2 y 4 integrantes.' },
);

// La API devuelve los mismos datos y añade un identificador. No convertimos tipos:
// si llega members: "tres" (o incluso "3"), se considera una respuesta corrupta.
export const apiRegistrationSchema = registrationSchema.safeExtend({ id: z.string().min(1) });
export const registrationListSchema = z.array(apiRegistrationSchema);
