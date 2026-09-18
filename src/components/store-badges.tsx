import Image from "next/image";

import { t } from "@/lib/l10n";
import appStore from "@/assets/badge-app-store.png";
import googlePlay from "@/assets/badge-google-play.png";

const finalCta = t("landing").finalCta;

type StoreBadgesProps = {
  className?: string;
  /** Altura das imagens dos badges (classe Tailwind). */
  height?: string;
};

/**
 * Badges das lojas. O app ainda não foi publicado, então são imagens
 * e não links — o texto ao redor é que sinaliza o lançamento.
 */
export function StoreBadges({ className = "", height = "h-11" }: StoreBadgesProps) {
  return (
    <div className={`flex flex-wrap items-center gap-4 ${className}`}>
      <Image
        src={appStore}
        alt={finalCta.appStoreAlt}
        className={`${height} w-auto rounded-lg transition-transform duration-200 hover:scale-105`}
      />
      <Image
        src={googlePlay}
        alt={finalCta.googlePlayAlt}
        className={`${height} w-auto rounded-lg transition-transform duration-200 hover:scale-105`}
      />
    </div>
  );
}
