import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createRegistration, getRegistrations } from './api/registrations';
import RegistrationForm from './components/RegistrationForm';
import RegistrationList from './components/RegistrationList';
import BonusDemo from './components/BonusDemo';

export default function App() {
  const [category, setCategory] = useState('');
  const queryClient = useQueryClient();
  const registrationsQuery = useQuery({
    queryKey: ['registrations'],
    queryFn: getRegistrations,
  });

  const registrationMutation = useMutation({
    mutationFn: createRegistration,
    onSuccess: async () => {
      // Después del POST, volvemos a consultar la API para mostrar el alta real.
      await queryClient.invalidateQueries({ queryKey: ['registrations'] });
      setCategory('');
    },
  });

  const registrations = registrationsQuery.data ?? [];
  const filteredRegistrations = registrations.filter((item) => !category || item.category === category);
  const participantCount = registrations.reduce((total, item) => total + item.members, 0);

  return (
    <div className="app-shell">
      <header className="site-header">
        <a href="#main" className="brand" aria-label="JamLink, ir al contenido">
          <span className="brand-mark" aria-hidden="true">J.</span> JamLink
        </a>
        <span className="header-note">Game jam universitaria · Proyecto de clase</span>
      </header>

      <main id="main">
        <section className="hero" aria-labelledby="hero-title">
          <div>
            <p className="eyebrow">IDEAS PEQUEÑAS. GRANDES JUEGOS.</p>
            <h1 id="hero-title">Tu próximo juego<br />empieza aquí.</h1>
            <p className="hero-note">Trae una idea, reúne a tu equipo y dale al play. Inscríbete en nuestra game jam y descubre qué está creando la comunidad.</p>
          </div>
          <div className="stats" aria-label="Datos de participación">
            <div className="stat"><strong>{registrationsQuery.isSuccess ? registrations.length : '—'}</strong><span>proyectos inscritos</span></div>
            <div className="stat"><strong>{registrationsQuery.isSuccess ? participantCount : '—'}</strong><span>personas creando</span></div>
          </div>
        </section>

        <div className="layout">
          <section className="panel" aria-labelledby="inscription-title">
            <RegistrationForm
              onSubmit={(data) => registrationMutation.mutateAsync(data)}
              onEdit={() => registrationMutation.reset()}
              isPending={registrationMutation.isPending}
              submitError={registrationMutation.isError ? registrationMutation.error.message : ''}
              successMessage={registrationMutation.isSuccess ? `¡${registrationMutation.data.projectName} ya está inscrito!` : ''}
            />
          </section>
          <section className="panel" aria-labelledby="list-title">
            <RegistrationList
              registrations={filteredRegistrations}
              isPending={registrationsQuery.isPending}
              isError={registrationsQuery.isError}
              error={registrationsQuery.error}
              isFetching={registrationsQuery.isFetching}
              onRetry={() => registrationsQuery.refetch()}
              category={category}
              setCategory={setCategory}
            />
          </section>
        </div>
        <BonusDemo />
      </main>

      <footer className="site-footer"><span>JamLink · Misión 4</span><span>Proyecto educativo. Utiliza datos ficticios.</span></footer>
    </div>
  );
}
