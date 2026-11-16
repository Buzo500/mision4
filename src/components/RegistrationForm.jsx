import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { categories, registrationSchema } from '../schemas/registration.js';

const defaultValues = {
  projectName: '',
  contactName: '',
  email: '',
  mode: 'equipo',
  members: 2,
  category: '',
  description: '',
  acceptRules: false,
};

function FieldError({ name, error }) {
  if (!error) return null;

  return <p className="field-error" id={`${name}-error`}>{error.message}</p>;
}

export default function RegistrationForm({ onSubmit, onEdit, isPending, submitError, successMessage }) {
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(registrationSchema),
    defaultValues,
    mode: 'onTouched',
  });

  const participationMode = watch('mode');
  const isSending = isPending || isSubmitting;

  async function submitRegistration(data) {
    try {
      await onSubmit(data);
      reset();
    } catch {
      // El padre muestra el error de la petición. Conservamos los campos.
    }
  }

  return (
    <>
      <div className="panel-header">
        <span className="section-number" aria-hidden="true">01</span>
        <div>
          <h2 id="inscription-title">Tu próxima idea empieza aquí.</h2>
          <p>Cuéntanos quién viene y qué quiere crear.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(submitRegistration, onEdit)} onChange={onEdit} noValidate aria-labelledby="inscription-title">
        <p className="form-note">Todos los campos son obligatorios.</p>
        <fieldset className="form-fields" disabled={isSending}>
          <legend className="sr-only">Datos de la inscripción</legend>

          <div className="field">
            <label htmlFor="projectName">Nombre del proyecto</label>
            <input
              id="projectName"
              placeholder="Por ejemplo, Píxel Nómada"
              {...register('projectName')}
              aria-invalid={Boolean(errors.projectName)}
              aria-describedby={errors.projectName ? 'projectName-error' : undefined}
            />
            <FieldError name="projectName" error={errors.projectName} />
          </div>

          <div className="form-row">
            <div className="field">
              <label htmlFor="contactName">Persona de contacto</label>
              <input
                id="contactName"
                autoComplete="name"
                placeholder="Tu nombre"
                {...register('contactName')}
                aria-invalid={Boolean(errors.contactName)}
                aria-describedby={errors.contactName ? 'contactName-error' : undefined}
              />
              <FieldError name="contactName" error={errors.contactName} />
            </div>
            <div className="field">
              <label htmlFor="email">Correo electrónico</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="nombre@ejemplo.com"
                {...register('email')}
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? 'email-error' : undefined}
              />
              <FieldError name="email" error={errors.email} />
            </div>
          </div>

          <div className="form-row">
            <div className="field">
              <label htmlFor="mode">Modalidad</label>
              <select
                id="mode"
                {...register('mode')}
                aria-invalid={Boolean(errors.mode)}
                aria-describedby={errors.mode ? 'mode-error' : undefined}
              >
                <option value="equipo">En equipo</option>
                <option value="individual">Individual</option>
              </select>
              <FieldError name="mode" error={errors.mode} />
            </div>
            <div className="field">
              <label htmlFor="members">Número de integrantes</label>
              <input
                id="members"
                type="number"
                {...register('members', { valueAsNumber: true })}
                aria-invalid={Boolean(errors.members)}
                aria-describedby={`members-help${errors.members ? ' members-error' : ''}`}
              />
              <p className="field-hint" id="members-help">
                {participationMode === 'individual'
                  ? 'En individual participa una persona.'
                  : 'El equipo debe tener entre 2 y 4 personas.'}
              </p>
              <FieldError name="members" error={errors.members} />
            </div>
          </div>

          <div className="field">
            <label htmlFor="category">Categoría del proyecto</label>
            <select
              id="category"
              {...register('category')}
              aria-invalid={Boolean(errors.category)}
              aria-describedby={errors.category ? 'category-error' : undefined}
            >
              <option value="">Elige una categoría</option>
              {categories.map((category) => <option key={category} value={category}>{category}</option>)}
            </select>
            <FieldError name="category" error={errors.category} />
          </div>

          <div className="field">
            <label htmlFor="description">¿Qué os gustaría crear?</label>
            <textarea
              id="description"
              rows={3}
              placeholder="Una idea, un género, una mecánica… No hace falta tenerlo todo decidido."
              {...register('description')}
              aria-invalid={Boolean(errors.description)}
              aria-describedby={errors.description ? 'description-error' : undefined}
            />
            <FieldError name="description" error={errors.description} />
          </div>

          <details className="rules">
            <summary>Leer las bases de participación</summary>
            <p>
              Puedes participar individualmente o en equipos de 2 a 4 personas.
              Presenta una idea propia y trata con respeto al resto de participantes.
              El nombre del proyecto, el contacto y la descripción aparecerán en el listado;
              el correo no se muestra en las tarjetas.
            </p>
          </details>

          <div className="field">
            <label className="checkbox-label" htmlFor="acceptRules">
              <input
                id="acceptRules"
                type="checkbox"
                {...register('acceptRules')}
                aria-invalid={Boolean(errors.acceptRules)}
                aria-describedby={errors.acceptRules ? 'acceptRules-error' : undefined}
              />
              He leído y acepto las bases de participación.
            </label>
            <FieldError name="acceptRules" error={errors.acceptRules} />
          </div>

          <button className="button button-primary" type="submit" disabled={isSending}>
            {isSending ? 'Guardando inscripción…' : 'Inscribir mi proyecto'}
            {!isSending && <span aria-hidden="true">↗</span>}
          </button>
        </fieldset>

        {submitError && <p className="message message-error" role="alert">{submitError}</p>}
        {successMessage && <p className="message message-success" role="status">{successMessage}</p>}
      </form>
    </>
  );
}
