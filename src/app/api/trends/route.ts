import { NextRequest, NextResponse } from 'next/server';

const SITE_KEYWORDS: Record<string, { keywords: string[]; domain: string }> = {
  MLM: { keywords: ['Celulares y Telefonía', 'Computación', 'Electrónica, Audio y Video', 'Consolas y Videojuegos', 'Electrodomésticos', 'Hogar y Muebles', 'Deportes y Fitness', 'Herramientas', 'Moda', 'Salud'], domain: 'mercadolibre.com.mx' },
  MLB: { keywords: ['Celulares e Telefones', 'Informática', 'Eletrônicos', 'Games', 'Eletrodomésticos', 'Casa e Decoração', 'Esportes', 'Ferramentas', 'Moda', 'Saúde'], domain: 'mercadolivre.com.br' },
  MLA: { keywords: ['Celulares y Telefonía', 'Computación', 'Electrónica, Audio y Video', 'Consolas y Videojuegos', 'Electrodomésticos', 'Hogar y Muebles', 'Deportes y Fitness', 'Herramientas', 'Moda', 'Salud'], domain: 'mercadolibre.com.ar' },
  MLC: { keywords: ['Celulares y Telefonía', 'Computación', 'Electrónica, Audio y Video', 'Consolas y Videojuegos', 'Electrodomésticos', 'Hogar y Muebles', 'Deportes y Fitness', 'Herramientas', 'Moda', 'Salud'], domain: 'mercadolibre.cl' },
  MCO: { keywords: ['Celulares y Telefonía', 'Computación', 'Electrónica, Audio y Video', 'Consolas y Videojuegos', 'Electrodomésticos', 'Hogar y Muebles', 'Deportes y Fitness', 'Herramientas', 'Moda', 'Salud'], domain: 'mercadolibre.com.co' },
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const site = searchParams.get('site') || 'MLM';

  const data = SITE_KEYWORDS[site] || SITE_KEYWORDS['MLM'];
  const trends = data.keywords.map((keyword, i) => ({ keyword, rank: i + 1 }));

  return NextResponse.json({ trends, site, mock: false, domain: data.domain });
}
