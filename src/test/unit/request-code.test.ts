import { describe, expect, it } from 'vitest';
import { createRequestCode, createPrivateAttachmentPath } from '@/features/inquiries/request-code';

describe('protocolo de solicitação', () => {
  it('gera códigos únicos, longos e não sequenciais para o atendimento', () => {
    const codes = Array.from({ length: 128 }, () => createRequestCode());
    expect(new Set(codes)).toHaveLength(128);
    expect(codes.every((code) => /^[A-Z0-9]{20}$/.test(code))).toBe(true);
  });

  it('cria caminho privado aleatório sem reutilizar o nome enviado', () => {
    const path = createPrivateAttachmentPath('AB12CD34EF56GH78IJ90', 'referência da cliente.png');
    expect(path).toMatch(/^AB12CD34EF56GH78IJ90\/[0-9a-f-]{36}\.png$/);
    expect(path).not.toContain('referência');
  });
});
