'use client';

import React, { useState } from 'react';
import { BookOpen, ShieldCheck } from 'lucide-react';
import { brand } from '@/src/config/brand';

type BrandMarkProps = {
  variant?: 'book' | 'shield';
  iconClassName?: string;
  imgClassName?: string;
  alt?: string;
};

/**
 * Logo. Jika NEXT_PUBLIC_LOGO_URL / /brand-logo.png gagal dimuat,
 * kembali ke ikon Lucide.
 */
export default function BrandMark({
  variant = 'book',
  iconClassName,
  imgClassName,
  alt = brand.name,
}: BrandMarkProps) {
  const [failed, setFailed] = useState(false);
  const Icon = variant === 'shield' ? ShieldCheck : BookOpen;

  if (brand.logoUrl && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- URL logo pembeli bisa eksternal
      <img
        src={brand.logoUrl}
        alt={alt}
        className={imgClassName}
        onError={() => setFailed(true)}
      />
    );
  }

  return <Icon className={iconClassName} aria-hidden />;
}
