import type { ImgHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

type BrandLogoProps = ImgHTMLAttributes<HTMLImageElement> & {
  variant?: 'full' | 'mark';
};

const logoSources = {
  full: '/branding/educonnect_new_logo.png',
  mark: '/branding/educonnect_new_mark.png',
} as const;

const configuredLogoPath = import.meta.env.VITE_BRAND_LOGO_PATH?.trim();

const BrandLogo = ({ variant = 'mark', className, alt = 'EduConnect', ...props }: BrandLogoProps) => {
  const source = configuredLogoPath || logoSources[variant];

  return (
    <img
      {...props}
      src={source}
      alt={alt}
      className={cn('object-contain', className)}
    />
  );
};

export default BrandLogo;
