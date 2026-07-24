import Image from "next/image";
import { cn } from "./cn";

/**
 * Logo — /public/kpc-logo-header.png (lockup horizontal KPC | Kromi Privacy
 * Center) vía next/image con altura configurable. Solo los headers en pantalla
 * (nav de la landing y topbar de la autoevaluación) usan este asset; el PDF y el
 * Open Graph siguen apuntando a /kpc-logo.png por separado (2026-07-24).
 * Dimensiones intrínsecas: 1643x280 (ratio fijo para evitar layout shift). El
 * alt es prop obligatoria (cero strings hardcodeados).
 */
const INTRINSIC_WIDTH = 1643;
const INTRINSIC_HEIGHT = 280;

export interface LogoProps {
  alt: string;
  /** Altura en px; el ancho se deriva del ratio intrínseco. */
  height?: number;
  className?: string;
  priority?: boolean;
}

export function Logo({ alt, height = 28, className, priority }: LogoProps) {
  const width = Math.round((height * INTRINSIC_WIDTH) / INTRINSIC_HEIGHT);
  return (
    <Image
      src="/kpc-logo-header.png"
      alt={alt}
      width={width}
      height={height}
      priority={priority}
      className={cn("shrink-0", className)}
    />
  );
}
