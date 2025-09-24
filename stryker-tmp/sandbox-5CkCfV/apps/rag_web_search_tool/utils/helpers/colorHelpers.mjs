/**
 * Simplified Color Helpers for Accessibility Validation
 * Extracted essential functions for contrast ratio calculation
 */
// @ts-nocheck


/**
 * Converts hex color to RGB
 */
export function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * Converts sRGB channel value to linear RGB
 */
function sRgbToLinearRgbChannel(channel) {
  const c = channel / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

/**
 * Calculates relative luminance according to WCAG 2.1
 */
export function relativeLuminance(rgb) {
  const r = sRgbToLinearRgbChannel(rgb.r);
  const g = sRgbToLinearRgbChannel(rgb.g);
  const b = sRgbToLinearRgbChannel(rgb.b);
  // WCAG coefficients
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Computes contrast ratio between two sRGB colors per WCAG (1-21)
 */
export function contrastRatio(foreground, background) {
  const L1 = relativeLuminance(foreground);
  const L2 = relativeLuminance(background);
  const lighter = Math.max(L1, L2);
  const darker = Math.min(L1, L2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Convenience: contrast ratio from hex inputs
 */
export function contrastRatioHex(fgHex, bgHex) {
  const fg = hexToRgb(fgHex);
  const bg = hexToRgb(bgHex);
  if (!fg || !bg) return null;
  return contrastRatio(fg, bg);
}
