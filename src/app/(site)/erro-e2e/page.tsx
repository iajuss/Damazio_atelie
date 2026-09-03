import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function ErrorBoundaryProbePage() {
  if (process.env.E2E_TEST_ERROR_BOUNDARY !== 'true') notFound();

  throw new Error('segredo-interno-e2e');
}

