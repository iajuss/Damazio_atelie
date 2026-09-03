import type { CustomizationField } from '@/features/catalog/types';

type CustomizationInputProps = {
  field: CustomizationField;
  value: string;
  error?: string;
  onChange: (value: string) => void;
};

export function CustomizationInput({ field, value, error, onChange }: CustomizationInputProps) {
  const id = `answer-${field.key}`;
  const errorId = `erro-answers-${field.key}`;
  const helpId = field.helpText ? `${id}-ajuda` : undefined;
  const describedBy = [helpId, error ? errorId : undefined].filter(Boolean).join(' ') || undefined;
  const label = <label htmlFor={id}>{field.label}{field.required ? <span aria-hidden="true"> *</span> : null}</label>;
  const common = { id, name: `answers.${field.key}`, value, required: field.required, 'aria-invalid': Boolean(error), 'aria-describedby': describedBy, onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => onChange(event.target.value) };

  return <div className="inquiry-field">
    {label}
    {field.type === 'textarea' ? <textarea {...common} rows={4} /> : null}
    {field.type === 'select' ? <select {...common}><option value="">Selecione uma opção</option>{field.options.map((option) => <option key={option} value={option}>{option}</option>)}</select> : null}
    {field.type === 'text' ? <input {...common} type="text" /> : null}
    {field.helpText ? <p id={helpId} className="inquiry-field__help">{field.helpText}</p> : null}
    {error ? <p id={errorId} className="inquiry-field__error">{error}</p> : null}
  </div>;
}
