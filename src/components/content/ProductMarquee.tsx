import Image from 'next/image';
import Link from 'next/link';

const samples = [
  ['/images/catalogo/sousplat-rosa-croche.jpeg', 'Sousplat rosé de crochê'], ['/images/catalogo/mesa-sousplats-croche.jpeg', 'Mesa posta com sousplats de crochê'], ['/images/catalogo/bolsa-dourada-croche.jpeg', 'Bolsa de crochê dourada'], ['/images/catalogo/sousplat-branco-dourado.jpeg', 'Sousplat branco com acabamento dourado'], ['/images/catalogo/toalha-marina.jpeg', 'Toalha bordada Marina'], ['/images/catalogo/toalha-milena.jpeg', 'Toalha bordada Milena'], ['/images/catalogo/toalha-ronaldo.jpeg', 'Toalha bordada Ronaldo'], ['/images/catalogo/toalha-tamires.jpeg', 'Toalha bordada Tamires'], ['/images/catalogo/toalha-heitor.jpeg', 'Toalha bordada Heitor'], ['/images/catalogo/kit-toalhas-embalado.jpeg', 'Kit de toalhas embalado'], ['/images/catalogo/toalha-djalma.jpeg', 'Toalha bordada Djalma'], ['/images/catalogo/toalha-jurema.jpeg', 'Toalha bordada Jurema'], ['/images/catalogo/toalhas-belo-delicia.jpeg', 'Toalhas bordadas Belo e Delícia'],
] as const;

export function ProductMarquee() {
  return <section className="product-marquee" aria-label="Amostras do atelier"><div className="product-marquee__viewport"><div className="product-marquee__track">{[false, true].map((isDuplicate) => <div className="product-marquee__group" aria-hidden={isDuplicate || undefined} key={String(isDuplicate)}>{samples.map(([src, alt]) => <Link className="product-marquee__item" href="/catalogo" key={`${isDuplicate}-${src}`} tabIndex={isDuplicate ? -1 : undefined}><Image src={src} alt={alt} fill sizes="(min-width: 64rem) 15rem, 9rem" unoptimized /></Link>)}</div>)}</div></div></section>;
}
