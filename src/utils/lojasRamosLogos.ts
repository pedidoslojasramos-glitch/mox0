export interface LogoPreset {
  id: string;
  name: string;
  tag: string;
  description: string;
  svgDataUri: string;
}

// High quality vector SVG Data URIs for Lojas Ramos
const SVG_CYAN_OFFICIAL = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 120" width="420" height="120">
  <defs>
    <linearGradient id="bgGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a" />
      <stop offset="100%" stop-color="#1e293b" />
    </linearGradient>
    <linearGradient id="cyanGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8" />
      <stop offset="50%" stop-color="#06b6d4" />
      <stop offset="100%" stop-color="#0284c7" />
    </linearGradient>
    <linearGradient id="orangeGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fb923c" />
      <stop offset="100%" stop-color="#ea580c" />
    </linearGradient>
  </defs>
  <rect width="420" height="120" rx="16" fill="url(#bgGrad1)" stroke="#334155" stroke-width="2"/>
  <g transform="translate(22, 20)">
    <rect x="0" y="0" width="80" height="80" rx="18" fill="url(#cyanGrad1)"/>
    <path d="M22 18 H46 C56 18 62 23 62 31 C62 38 56 42 46 42 H34 V62 H22 V18 Z M34 30 H44 C48 30 50 28 50 25 C50 22 48 21 44 21 H34 V30 Z" fill="#ffffff"/>
    <path d="M42 40 L58 62 H44 L31 43 H42 Z" fill="url(#orangeGrad1)"/>
  </g>
  <text x="122" y="46" font-family="system-ui, -apple-system, sans-serif" font-weight="800" font-size="13" fill="#38bdf8" letter-spacing="4">LOJAS</text>
  <text x="122" y="82" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="35" fill="#ffffff" letter-spacing="2">RAMOS</text>
  <text x="122" y="100" font-family="system-ui, -apple-system, sans-serif" font-weight="700" font-size="9.5" fill="#94a3b8" letter-spacing="1">MÓVEIS E ELETRODOMÉSTICOS</text>
</svg>`;

const SVG_RED_RETAIL = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 120" width="420" height="120">
  <defs>
    <linearGradient id="redGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#b91c1c" />
      <stop offset="100%" stop-color="#7f1d1d" />
    </linearGradient>
    <linearGradient id="goldGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fde047" />
      <stop offset="100%" stop-color="#eab308" />
    </linearGradient>
  </defs>
  <rect width="420" height="120" rx="16" fill="url(#redGrad2)" stroke="#ef4444" stroke-width="1.5"/>
  <g transform="translate(22, 20)">
    <rect x="0" y="0" width="80" height="80" rx="18" fill="#ffffff" stroke="url(#goldGrad2)" stroke-width="3"/>
    <path d="M22 18 H46 C56 18 62 23 62 31 C62 38 56 42 46 42 H34 V62 H22 V18 Z M34 30 H44 C48 30 50 28 50 25 C50 22 48 21 44 21 H34 V30 Z" fill="#b91c1c"/>
    <path d="M42 40 L58 62 H44 L31 43 H42 Z" fill="url(#goldGrad2)"/>
  </g>
  <text x="122" y="46" font-family="system-ui, -apple-system, sans-serif" font-weight="800" font-size="13" fill="#fef08a" letter-spacing="4">LOJAS</text>
  <text x="122" y="82" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="35" fill="#ffffff" letter-spacing="2">RAMOS</text>
  <text x="122" y="100" font-family="system-ui, -apple-system, sans-serif" font-weight="700" font-size="9.5" fill="#fca5a5" letter-spacing="1">REDE DE 40 FILIAIS • VAREJO</text>
</svg>`;

const SVG_ROYAL_BLUE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 120" width="420" height="120">
  <defs>
    <linearGradient id="blueGrad3" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1e3a8a" />
      <stop offset="100%" stop-color="#172554" />
    </linearGradient>
    <linearGradient id="goldGrad3" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#facc15" />
      <stop offset="100%" stop-color="#ca8a04" />
    </linearGradient>
  </defs>
  <rect width="420" height="120" rx="16" fill="url(#blueGrad3)" stroke="#3b82f6" stroke-width="1.5"/>
  <g transform="translate(22, 20)">
    <rect x="0" y="0" width="80" height="80" rx="18" fill="url(#goldGrad3)"/>
    <path d="M22 18 H46 C56 18 62 23 62 31 C62 38 56 42 46 42 H34 V62 H22 V18 Z M34 30 H44 C48 30 50 28 50 25 C50 22 48 21 44 21 H34 V30 Z" fill="#0f172a"/>
    <path d="M42 40 L58 62 H44 L31 43 H42 Z" fill="#ffffff"/>
  </g>
  <text x="122" y="46" font-family="system-ui, -apple-system, sans-serif" font-weight="800" font-size="13" fill="#fde047" letter-spacing="4">LOJAS</text>
  <text x="122" y="82" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="35" fill="#ffffff" letter-spacing="2">RAMOS</text>
  <text x="122" y="100" font-family="system-ui, -apple-system, sans-serif" font-weight="700" font-size="9.5" fill="#93c5fd" letter-spacing="1">SISTEMA CENTRAL DE LOGÍSTICA</text>
</svg>`;

const SVG_LIGHT_MINIMAL = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 120" width="420" height="120">
  <defs>
    <linearGradient id="cyanGrad4" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0284c7" />
      <stop offset="100%" stop-color="#0f766e" />
    </linearGradient>
  </defs>
  <rect width="420" height="120" rx="16" fill="#ffffff" stroke="#cbd5e1" stroke-width="2"/>
  <g transform="translate(22, 20)">
    <rect x="0" y="0" width="80" height="80" rx="18" fill="url(#cyanGrad4)"/>
    <path d="M22 18 H46 C56 18 62 23 62 31 C62 38 56 42 46 42 H34 V62 H22 V18 Z M34 30 H44 C48 30 50 28 50 25 C50 22 48 21 44 21 H34 V30 Z" fill="#ffffff"/>
    <path d="M42 40 L58 62 H44 L31 43 H42 Z" fill="#38bdf8"/>
  </g>
  <text x="122" y="46" font-family="system-ui, -apple-system, sans-serif" font-weight="800" font-size="13" fill="#0284c7" letter-spacing="4">LOJAS</text>
  <text x="122" y="82" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="35" fill="#0f172a" letter-spacing="2">RAMOS</text>
  <text x="122" y="100" font-family="system-ui, -apple-system, sans-serif" font-weight="700" font-size="9.5" fill="#64748b" letter-spacing="1">QUALIDADE E CONFIANÇA</text>
</svg>`;

function encodeSvg(svg: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const DEFAULT_LOJAS_RAMOS_LOGO = encodeSvg(SVG_CYAN_OFFICIAL);

export const LOJAS_RAMOS_LOGOS: LogoPreset[] = [
  {
    id: 'cyan_official',
    name: 'Lojas Ramos - Cyan & Laranja (Oficial)',
    tag: 'Recomendado',
    description: 'Design corporativo moderno em fundo escuro com ícone estilizado R e detalhes em azul e laranja.',
    svgDataUri: encodeSvg(SVG_CYAN_OFFICIAL)
  },
  {
    id: 'red_retail',
    name: 'Lojas Ramos - Vermelho Varejo',
    tag: 'Varejo',
    description: 'Logo clássico de alta visibilidade em tom vermelho vibrante e detalhes em dourado.',
    svgDataUri: encodeSvg(SVG_RED_RETAIL)
  },
  {
    id: 'royal_blue',
    name: 'Lojas Ramos - Azul Royal & Dourado',
    tag: 'Premium',
    description: 'Estilo executivo com fundo azul profundo e contraste em amarelo dourado.',
    svgDataUri: encodeSvg(SVG_ROYAL_BLUE)
  },
  {
    id: 'light_minimal',
    name: 'Lojas Ramos - Fundo Claro / Minimalista',
    tag: 'Fundo Claro',
    description: 'Versão em fundo branco para relatórios e impressões em papel.',
    svgDataUri: encodeSvg(SVG_LIGHT_MINIMAL)
  }
];
