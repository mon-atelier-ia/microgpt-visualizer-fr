import type { MouseEvent, TouchEvent } from "react";

interface NeuronLike {
  x: number;
  y: number;
  r: number;
}

/**
 * Find the closest neuron to the pointer within 3× radius.
 * Returns { group, index } or null if nothing is close enough.
 */
export function findClosestNeuron(
  e: MouseEvent<HTMLCanvasElement>,
  canvas: HTMLCanvasElement,
  neurons: NeuronLike[][],
): { group: number; index: number } | null {
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;

  let closest: { group: number; index: number } | null = null;
  let closestDist = Infinity;

  for (let gi = 0; gi < neurons.length; gi++) {
    for (let ni = 0; ni < neurons[gi].length; ni++) {
      const n = neurons[gi][ni];
      const d = Math.hypot(mx - n.x, my - n.y);
      if (d < n.r * 3 && d < closestDist) {
        closest = { group: gi, index: ni };
        closestDist = d;
      }
    }
  }

  return closest;
}

/**
 * Create touch event handlers that delegate to the mouse handlers.
 * Spread the result onto a <canvas> element.
 */
export function makeTouchHandlers(
  handleMouseMove: (e: MouseEvent<HTMLCanvasElement>) => void,
  handleMouseLeave: () => void,
) {
  return {
    onTouchStart: (e: TouchEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      handleMouseMove(e.touches[0] as unknown as MouseEvent<HTMLCanvasElement>);
    },
    onTouchMove: (e: TouchEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      handleMouseMove(e.touches[0] as unknown as MouseEvent<HTMLCanvasElement>);
    },
    onTouchEnd: handleMouseLeave,
  };
}
