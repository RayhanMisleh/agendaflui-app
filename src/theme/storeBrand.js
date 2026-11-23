import { contrastRatio } from "./contrast";
import { colors } from "./tokens";

const HEX = /^#[0-9A-Fa-f]{6}$/;
const MIN_CONTRAST = 4.5;

// Tons da cor da loja sobre a paleta clara. Qualquer dado faltando, fora de #RRGGBB ou sem contraste: volta à da Agenda Flui.
export function storePalette(business, base = colors.light) {
  const tokens = business && business.brand && business.brand.tokens;
  if (!tokens || typeof tokens !== "object") return base;
  const brand = tokens["--brand"];
  const brandStrong = tokens["--brand-strong"];
  const brandTint = tokens["--brand-tint"];
  const onBrand = tokens["--on-brand"];
  const brandText = tokens["--brand-text"];
  const all = [brand, brandStrong, brandTint, onBrand, brandText];
  if (!all.every((v) => typeof v === "string" && HEX.test(v))) return base;
  if (contrastRatio(onBrand, brand) < MIN_CONTRAST) return base;
  if (contrastRatio(brandText, base.ground) < MIN_CONTRAST) return base;
  return { ...base, brand, brandStrong, brandTint, onBrand, brandText };
}
