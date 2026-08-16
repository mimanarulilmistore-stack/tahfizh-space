import Image from 'next/image';
import {
  BRAND_LOGO_ON_DARK,
  BRAND_LOGO_ON_LIGHT,
  BRAND_NAME,
} from '@/src/utils/brand';

type BrandLogoProps = {
  /** sm = header sempit, md = login/portal, lg = hero */
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  /** Tampilkan nama lembaga di samping/bawah logo */
  showName?: boolean;
  /** horizontal = logo + nama sejajar; stacked = logo di atas nama */
  layout?: 'horizontal' | 'stacked';
  /**
   * onDark = latar gelap (login/admin) — logo putih+emas
   * onLight = latar terang (beranda/wali) — logo navy+emas
   */
  tone?: 'onDark' | 'onLight';
  /** Warna teks nama lembaga; default menyesuaikan tone */
  nameClassName?: string;
};

const SIZE_MAP = {
  sm: { box: 'h-9 w-9', px: 36 },
  md: { box: 'h-16 w-16', px: 64 },
  lg: { box: 'h-24 w-24', px: 96 },
} as const;

export default function BrandLogo({
  size = 'sm',
  className = '',
  showName = false,
  layout = 'horizontal',
  tone = 'onDark',
  nameClassName,
}: BrandLogoProps) {
  const s = SIZE_MAP[size];
  const isStacked = layout === 'stacked';
  const onDark = tone === 'onDark';
  const src = onDark ? BRAND_LOGO_ON_DARK : BRAND_LOGO_ON_LIGHT;

  const defaultNameClass = onDark
    ? 'text-white'
    : 'text-slate-900 dark:text-slate-100';

  return (
    <div
      className={`inline-flex ${
        isStacked ? 'flex-col items-center gap-2' : 'items-center gap-2.5'
      } ${className}`}
    >
      <div className={`${s.box} relative shrink-0 overflow-hidden`}>
        <Image
          src={src}
          alt={`Logo ${BRAND_NAME}`}
          width={s.px}
          height={s.px}
          className="h-full w-full object-contain"
          priority={size !== 'sm'}
        />
      </div>
      {showName && (
        <span
          className={`font-bold tracking-wide ${nameClassName || defaultNameClass} ${
            isStacked
              ? 'text-center text-base sm:text-lg'
              : size === 'sm'
                ? 'text-sm leading-tight'
                : 'text-lg leading-tight'
          }`}
        >
          {BRAND_NAME}
        </span>
      )}
    </div>
  );
}
