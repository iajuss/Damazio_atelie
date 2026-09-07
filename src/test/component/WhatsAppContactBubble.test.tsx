import { render, screen } from '@testing-library/react';
import { WhatsAppContactBubble } from '@/components/layout/WhatsAppContactBubble';

describe('WhatsAppContactBubble', () => {
  it('oferece o canal oficial da Damazio em um atalho acessível', () => {
    render(<WhatsAppContactBubble />);

    expect(screen.getByRole('navigation', { name: 'Contato pelo WhatsApp' })).toBeInTheDocument();

    const link = screen.getByRole('link', { name: 'Falar com a Damazio pelo WhatsApp' });
    expect(link).toHaveAttribute('href', 'https://wa.me/5511910771179');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noreferrer');
    expect(link).toHaveClass('whatsapp-contact-bubble');
    expect(link.querySelectorAll('svg path')).toHaveLength(1);
  });
});
