import { categories } from '../schemas/registration.js';

export default function RegistrationList({
  registrations,
  isPending,
  isError,
  error,
  isFetching,
  onRetry,
  category,
  setCategory,
}) {
  return (
    <>
      <div className="panel-header">
        <span className="section-number" aria-hidden="true">02</span>
        <div>
          <h2 id="list-title">Conoce a la comunidad.</h2>
          <p>Ideas distintas. Las mismas ganas de crear.</p>
        </div>
      </div>

      <div className="list-toolbar">
        <div className="field">
          <label htmlFor="category-filter">Filtrar por categoría</label>
          <select id="category-filter" value={category} onChange={(event) => setCategory(event.target.value)}>
            <option value="">Todas las categorías</option>
            {categories.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </div>
        <button className="button button-secondary" type="button" onClick={onRetry} disabled={isFetching}>
          {isFetching ? 'Actualizando…' : 'Actualizar'}
        </button>
      </div>

      {isPending && (
        <div className="list-state" role="status">
          <span className="state-symbol" aria-hidden="true">···</span>
          <p>Cargando las inscripciones…</p>
        </div>
      )}

      {isError && (
        <div className="message message-error" role="alert">
          <p>{error?.message || 'No se han podido cargar las inscripciones.'}</p>
          {registrations.length > 0 && <p>Se conserva el último listado disponible.</p>}
          <button className="button button-secondary" type="button" onClick={onRetry} disabled={isFetching}>
            Reintentar
          </button>
        </div>
      )}

      {!isPending && !isError && registrations.length === 0 && (
        <div className="list-state" role="status">
          <span className="state-symbol" aria-hidden="true">+</span>
          <h3>{category ? 'Todavía no hay proyectos de esta categoría.' : 'El primer proyecto puede ser el tuyo.'}</h3>
          <p>{category ? 'Prueba con otra categoría o añade tu idea.' : 'Completa el formulario y únete a la jam.'}</p>
        </div>
      )}

      {registrations.length > 0 && (
        <>
          <p className="list-count" role="status">
            {registrations.length} {registrations.length === 1 ? 'proyecto en el listado' : 'proyectos en el listado'}
          </p>
          <ul className="registration-list">
            {registrations.map((registration) => (
              <li key={registration.id}>
                <article className="registration-card">
                  <div className="card-heading">
                    <span className="project-avatar" aria-hidden="true">
                      {registration.projectName.slice(0, 2).toUpperCase()}
                    </span>
                    <div>
                      <span className="category-badge">{registration.category}</span>
                      <h3>{registration.projectName}</h3>
                    </div>
                  </div>
                  <p className="project-description">{registration.description}</p>
                  <div className="card-meta">
                    <span>{registration.contactName}</span>
                    <span>
                      {registration.mode === 'individual' ? 'Individual' : 'Equipo'} ·{' '}
                      {registration.members} {registration.members === 1 ? 'persona' : 'personas'}
                    </span>
                  </div>
                </article>
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}
