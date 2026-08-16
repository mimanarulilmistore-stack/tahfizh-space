import { BRAND_NAME } from '@/src/utils/brand';

type MioAcademyMarkProps = {
  /** onDark = latar gelap (putih + emas); onLight = latar terang (navy + emas) */
  tone?: 'onDark' | 'onLight';
  className?: string;
  title?: string;
};

/**
 * Logo mark MIO Academy (SVG) — kontras di tema gelap & terang.
 * Navy gelap di atas hitam sulit terbaca, jadi tone onDark memakai putih/krem.
 */
export default function MioAcademyMark({
  tone = 'onDark',
  className = '',
  title = `Logo ${BRAND_NAME}`,
}: MioAcademyMarkProps) {
  const isDarkBg = tone === 'onDark';
  const primary = isDarkBg ? '#F8FAFC' : '#0B1F4A'; // putih vs navy
  const gold = '#E8B923';
  const textPrimary = isDarkBg ? '#F8FAFC' : '#0B1F4A';

  return (
    <svg
      viewBox="0 0 200 220"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={title}
      className={className}
    >
      <title>{title}</title>

      {/* Bintang emas */}
      <polygon
        fill={gold}
        points="100,8 106,22 122,22 109,32 114,48 100,38 86,48 91,32 78,22 94,22"
      />

      {/* Lengkung kubah */}
      <path
        d="M42 78 A58 58 0 0 1 158 78"
        fill="none"
        stroke={primary}
        strokeWidth="5"
        strokeLinecap="round"
      />

      {/* Menara */}
      <path
        fill={primary}
        d="M100 48 L108 62 L108 70 L112 70 L112 118 L88 118 L88 70 L92 70 L92 62 Z"
      />
      <rect x="94" y="78" width="12" height="8" rx="1" fill={isDarkBg ? '#0B1F4A' : '#E8B923'} opacity="0.35" />

      {/* Kitab terbuka — lapisan navy/putih */}
      <path
        fill={primary}
        d="M100 118 C78 118 52 124 40 136 C58 128 80 126 100 132 C120 126 142 128 160 136 C148 124 122 118 100 118 Z"
      />
      <path
        fill={primary}
        opacity="0.85"
        d="M100 128 C76 128 54 134 42 146 C60 138 80 136 100 142 C120 136 140 138 158 146 C146 134 124 128 100 128 Z"
      />
      {/* Garis emas bawah kitab */}
      <path
        fill="none"
        stroke={gold}
        strokeWidth="5"
        strokeLinecap="round"
        d="M38 150 C60 140 82 138 100 144 C118 138 140 140 162 150"
      />

      {/* Teks MIO ACADEMY */}
      <text
        x="42"
        y="188"
        fill={textPrimary}
        fontFamily="system-ui, -apple-system, Segoe UI, sans-serif"
        fontWeight="800"
        fontSize="28"
        letterSpacing="0.5"
      >
        MIO
      </text>
      <text
        x="98"
        y="186"
        fill={textPrimary}
        fontFamily="system-ui, -apple-system, Segoe UI, sans-serif"
        fontWeight="500"
        fontSize="13"
        letterSpacing="2.2"
      >
        ACADEMY
      </text>
    </svg>
  );
}
