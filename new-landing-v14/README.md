# Study in Malaysia — v14 (3D remake)

Built with React 18 + React Three Fiber + three.js, GSAP (ScrollTrigger, SplitText, Draggable) and Lenis.
This folder is the **built, static site** — deploy it as-is (all paths are relative, no CDN; works with `script-src 'self'`).
The form posts JSON to `/api/enquiry` with the same fields as the current landing page.

## Sections
Silk-shader hero (6 Malaysia photos dissolving) · bento "Why" · extruded 3D map with region beacons · services rail ·
3D university carousel (top 12, QS 2027) · Student Pass dial · course finder · "Jom makan" 3D photo dome ·
escapes rail · funding panels + loan partners · makan-table family checker · postcard testimonials · FAQ ·
6-question evaluation form · waving Jalur Gemilang footer · full 391-institution directory overlay.

## Editing
Source is in `source/`. To rebuild:
1. `cd source && npm install`
2. Copy `img/`, `fonts/`, `logo/`, `data/` from this folder into `source/public/`
3. `npm run build` → output in `source/dist/` (copy it back over this folder)
