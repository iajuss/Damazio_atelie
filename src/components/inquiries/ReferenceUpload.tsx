import { useId } from 'react';

type ReferenceUploadProps = {
  files: File[];
  isUploading?: boolean;
  error?: string;
  onAdd: (files: File[]) => void;
  onRemove: (index: number) => void;
};

export function ReferenceUpload({ files, isUploading = false, error, onAdd, onRemove }: ReferenceUploadProps) {
  const inputId = useId();
  const errorId = 'erro-attachments';
  return <fieldset className="reference-upload" aria-describedby={error ? errorId : undefined}>
    <legend>Referências visuais <span className="reference-upload__optional">(opcional)</span></legend>
    <p>Envie até 3 imagens em JPEG, PNG ou WebP, com até 5 MB cada. Elas são usadas apenas para entender sua ideia.</p>
    <label className="button button--secondary" htmlFor={inputId}>Adicionar referências</label>
    <input id={inputId} className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(event) => {
      onAdd(Array.from(event.target.files ?? []));
      event.currentTarget.value = '';
    }} />
    <p role="status" aria-live="polite">{isUploading && files.length > 0 ? `Enviando ${files.length} referência${files.length === 1 ? '' : 's'}…` : files.length === 0 ? 'Nenhuma referência selecionada.' : `${files.length} referência${files.length === 1 ? '' : 's'} selecionada${files.length === 1 ? '' : 's'}.`}</p>
    {files.length > 0 ? <ul className="reference-upload__files">{files.map((file, index) => <li key={`${file.name}-${file.lastModified}-${index}`}><span>{file.name}</span><button type="button" onClick={() => onRemove(index)} aria-label={`Remover ${file.name}`}>Remover</button></li>)}</ul> : null}
    {error ? <p id={errorId} className="inquiry-field__error">{error}</p> : null}
  </fieldset>;
}
