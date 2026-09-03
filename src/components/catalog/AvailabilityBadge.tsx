import type { Availability } from '@/features/catalog/types';

const labels: Record<Availability, string> = {
  available: 'Disponível para encomenda',
  limited: 'Disponibilidade limitada',
  unavailable: 'Indisponível no momento',
};

type AvailabilityBadgeProps = { availability: Availability };

export function AvailabilityBadge({ availability }: AvailabilityBadgeProps) {
  return <span className={`availability-badge availability-badge--${availability}`}>{labels[availability]}</span>;
}
