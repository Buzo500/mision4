import { useQuery } from '@tanstack/react-query';
import { getCorruptDemo } from '../api/registrations';

export default function BonusDemo() {
  const demoQuery = useQuery({
    queryKey: ['demo', 'corrupt-response'],
    queryFn: getCorruptDemo,
    enabled: false,
    retry: false,
  });
  const corruptDetected = demoQuery.error?.name === 'InvalidApiResponseError';

  return (
    <details className="bonus-panel">
      <summary>Demo de clase · Validar también la respuesta de la API</summary>
      <p>Esta prueba consulta un recurso separado de MockAPI con un dato incorrecto: <code>members: "tres"</code>. Se aplica el mismo esquema Zod del listado real, sin modificar las inscripciones.</p>
      <div className="bonus-actions">
        <button type="button" className="button button-secondary" onClick={() => demoQuery.refetch()} disabled={demoQuery.isFetching}>
          {demoQuery.isFetching ? 'Consultando la API…' : 'Probar respuesta corrupta'}
        </button>
      </div>
      {demoQuery.isFetching && <p role="status">Comprobando la respuesta con safeParse…</p>}
      {!demoQuery.isFetching && corruptDetected && <p role="status" className="message message-success">Bonus demostrado: Zod ha rechazado el dato corrupto. {demoQuery.error.message} No ha entrado en el listado.</p>}
      {!demoQuery.isFetching && demoQuery.isError && !corruptDetected && <p role="alert" className="message message-error">No se ha podido completar la prueba: {demoQuery.error.message}</p>}
      {!demoQuery.isFetching && demoQuery.isSuccess && <p role="status">La respuesta es válida. El recurso de demostración debe contener un valor incorrecto para demostrar el bonus.</p>}
    </details>
  );
}
