import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Las pruebas nunca envían inscripciones a la API de verdad.
vi.stubEnv('VITE_API_URL', 'https://jamlink.test/inscripciones');
vi.stubEnv('VITE_DEMO_API_URL', 'https://jamlink.test/demo');

afterEach(() => cleanup());
