import MioAcademyMark from '@/components/MioAcademyMark';
import { BRAND_NAME } from '@/src/utils/brand';

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
  sm: { box: 'h-9 w-9', svg: 'h-8 w-8' },
  md: { box: 'h-16 w-16', svg: 'h-14 w-14' },
  lg: { box: 'h-24 w-24', svg: 'h-[5.5rem] w-[5.5rem]' },
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

  const boxBg = onDark
    ? 'bg-slate-900/80 border-slate-700/70'
    : 'bg-white border-slate-200 shadow-sm';

  const defaultNameClass = onDark
    ? 'text-white'
    : 'text-slate-900 dark:text-slate-100';

  return (
    <div
      className={`inline-flex ${
        isStacked ? 'flex-col items-center gap-2' : 'items-center gap-2.5'
      } ${className}`}
    >
      <div
        className={`${s.box} relative shrink-0 overflow-hidden rounded-xl border ${boxBg} flex items-center justify-center p-1`}
      >
        <MioAcademyMark tone={tone} className={s.svg} />
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
