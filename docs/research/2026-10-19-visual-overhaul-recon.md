# Visual overhaul — recon (2026-10-19)

Status: research only, no decision taken. Feeds the brainstorming for the "peau neuve" project.

Every version/date below was read from the npm registry (`dist-tags.latest` + `time`) on 2026-10-19.
Re-check: `curl -s https://registry.npmjs.org/<pkg> | jq '."dist-tags".latest'`.
Sources marked **(secondary)** are not primary; **(not verified)** means nobody opened the source.

## 1. Internal context (wiki `C:\Dev\wiki`)

- `entities/microgpt-visualizer-fr.md`: 6 aesthetic directions explored; "Digital Explorer" kept as playground
  only (never applied); "Cahier du Savant" rejected 3×. No 3D ever used in this project.
- `topics/ia/scrollytelling-xray-design.md` (sibling microgpt-xray, GSAP + ScrollTrigger): principle
  **"the spectacle IS the data"**; anti-patterns: Inter/Poppins/Space Grotesk, decorative glow orbs, empty hero.
- `entities/three-js.md`: three used in 12 portfolio projects; models default to stale r128/r160 → pin.
- `topics/ia/animation-enfants-education.md` (stale, secondary sources): 200–500 ms timings, interruptible,
  `prefers-reduced-motion` mandatory, animate only transform/opacity. Not measured.
- `topics/llm-tooling/cookbook-frontend-anti-slop-quatre-couches.md`: prompts alone regress to average "slop";
  need reference renders + executable building blocks + gates.
- Gaps: no LLM-viz material, no measured 3D perf on low-end school hardware, no 3D accessibility guidance.

## 2. 3D stack

| Package                     | Latest stable  | Date       | Notes                                                                                                  |
| --------------------------- | -------------- | ---------- | ------------------------------------------------------------------------------------------------------ |
| three                       | 0.186.1 (r186) | 2026-09-24 | `three/webgpu` + `three/tsl`; WebGPURenderer falls back to WebGL2; WebGLRenderer still shipped         |
| @react-three/fiber          | 9.8.2          | 2026-10-14 | peer `react >=19 <19.4`; **v9 has no official WebGPU**; v10 alpha (10.0.0-alpha.6, 2026-10-17) adds it |
| @react-three/drei           | 10.7.9         | 2026-09-25 | peer fiber ^9                                                                                          |
| @react-three/postprocessing | 3.2.0          | 2026-10-10 | via postprocessing 6.39.5 → **three <0.187.0** (blocks future three upgrade)                           |

Sources: https://threejs.org/docs/pages/WebGPURenderer.html, https://r3f.docs.pmnd.rs/getting-started/introduction

WebGPU support (https://caniuse.com/webgpu, 87.8 % global): Chrome/Edge 113+ (ChromeOS, Windows, macOS; Android
121+; Linux "coming soon" per https://developer.chrome.com/docs/web-platform/webgpu/overview), Safari 26 incl.
iPadOS (https://webkit.org/blog/16993/), Firefox 141+ Windows only by default. → **WebGL2 fallback mandatory.**

## 3. Alternatives / animation

| Package                | Latest | Date                                                                   |
| ---------------------- | ------ | ---------------------------------------------------------------------- |
| @babylonjs/core        | 9.31.0 | 2026-10-15                                                             |
| ogl                    | 1.0.11 | 2025-01-27 (stale)                                                     |
| pixi.js                | 8.22.0 | 2026-10-01                                                             |
| @rive-app/react-canvas | 4.37.0 | 2026-10-18                                                             |
| motion                 | 14.4.0 | 2026-10-19                                                             |
| gsap                   | 3.15.0 | 2026-04-13 — free, non-OSS license (https://gsap.com/standard-license) |

Platform: View Transitions same-document 92.9 % (Firefox 144+); cross-document partial in Firefox
(https://caniuse.com/view-transitions). Scroll-driven animations 87.8 % (Safari 26, Firefox 161).

## 4. Reference LLM visualizations

- **bbycroft LLM Viz** — https://github.com/bbycroft/llm-viz (MIT): 3D GPT inference walkthrough. Next.js +
  Tailwind per repo files; rendering API (not verified). No published usability critique found.
- **Transformer Explainer** — https://github.com/poloclub/transformer-explainer, paper https://arxiv.org/abs/2408.04619:
  live GPT-2 in browser; 90-participant user study (CHI 2026); only one with measured learning outcome.
- **AnimatedLLM** — https://arxiv.org/abs/2601.04213 (Jan 2026): pre-computed traces, non-expert / high-school audience.
- Inference (ours): microgpt is small enough to show **every** weight and train **live** — none of the above does.

## 5. Bundle / performance

Bundlephobia full-import min+gzip (worst case, not tree-shaken): three 185 kB, fiber 58 kB, pixi 265 kB,
motion 56 kB, gsap 27 kB. **Real tree-shaken Vite build not measured yet** — to benchmark before choosing.
R3F low-end guidance: `frameloop="demand"`, instancing, PerformanceMonitor, adaptive DPR
(https://r3f.docs.pmnd.rs/advanced/scaling-performance). No official reduced-motion guidance for 3D.

## 6. Platform features (Chrome primary, not "trends")

https://chrome.dev/css-wrapped-2025: customizable select, scroll-state queries, nested view-transition groups,
`corner-shape`, `shape()`, CSS `if()`, `::scroll-marker`, interest invokers. "Liquid glass" / Awwwards trends: not verified.

## Open gaps

Firefox WebGPU Linux/Android; real bundle size after tree-shaking; 3D perf on target devices; target audience/devices
(question pending to the user).
