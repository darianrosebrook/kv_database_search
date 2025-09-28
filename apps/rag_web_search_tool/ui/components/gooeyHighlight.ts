/**
 * Gooey highlight effect utilities
 */

export interface GooeyConfig {
  intensity: number;
  radius: number;
  color: string;
  duration: number;
}

export const createGooeyHighlight = (config: Partial<GooeyConfig> = {}) => {
  const {
    intensity = 0.8,
    radius = 20,
    color = "#ffffff",
    duration = 300,
  } = config;

  return {
    intensity,
    radius,
    color,
    duration,
  };
};

export const applyGooeyEffect = (
  element: HTMLElement,
  config: GooeyConfig
): void => {
  const { intensity, radius, color, duration } = config;

  element.style.filter = `blur(${intensity}px)`;
  element.style.borderRadius = `${radius}px`;
  element.style.backgroundColor = color;
  element.style.transition = `all ${duration}ms ease-in-out`;
};

export const removeGooeyEffect = (element: HTMLElement): void => {
  element.style.filter = "";
  element.style.borderRadius = "";
  element.style.backgroundColor = "";
  element.style.transition = "";
};
