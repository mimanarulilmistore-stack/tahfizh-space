import Image from 'next/image';
import { BRAND_LOGO_SRC, BRAND_NAME } from '@/src/utils/brand';

type BrandLogoProps = {
  /** sm = header sempit, md = login/portal, lg = hero */
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  /** Tampilkan nama lembaga di samping/bawah logo */
  showName?: boolean;
  /** horizontal = logo + nama sejajar; stacked = logo di atas nama */
  layout?: 'horizontal' | 'stacked';
};

const SIZE_MAP = {
  sm: { box: 'h-9 w-9', img: 36 },
  md: { box: 'h-16 w-16', img: 64 },
  lg: { box: 'h-24 w-24', img: 96 },
} as const;

export default function BrandLogo({
  size = 'sm',
  className = '',
  showName = false,
  layout = 'horizontal',
}: BrandLogoProps) {
  const s = SIZE_MAP[size];
  const isStacked = layout === 'stacked';

  return (
    <div
      className={`inline-flex ${
        isStacked ? 'flex-col items-center gap-2' : 'items-center gap-2.5'
      } ${className}`}
    >
      <div
        className={`${s.box} relative shrink-0 overflow-hidden rounded-xl border border-slate-700/60 bg-black shadow-sm`}
      >
        <Image
          src={BRAND_LOGO_SRC}
          alt={`Logo ${BRAND_NAME}`}
          width={s.img}
          height={s.img}
          className="h-full w-full object-cover"
          priority={size !== 'sm'}
        />
      </div>
      {showName && (
        <span
          className={`font-bold tracking-wide text-white ${
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
