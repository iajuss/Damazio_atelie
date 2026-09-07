import { RequestExperience } from '@/components/inquiries/RequestExperience';
import { publicPageMetadata } from '@/lib/site';

export const metadata = publicPageMetadata('Crie a sua peça', 'Conte à Damazio Atelier a ideia que você quer transformar em uma criação.', '/solicitar-orcamento');

export default function CustomRequestPage() { return <RequestExperience requestKind="custom" />; }
