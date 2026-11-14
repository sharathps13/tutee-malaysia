# Tutee Connect — Study in Malaysia (v13.5 "Warna Malaysia")

This is a static landing page. Open `index.html` through any static server, for example `python -m http.server`.

## Concept
- The page is led by HD photographs of Malaysia, and every section takes its colour from the place in its photos:
  - Jalur Gemilang navy
  - Penang heritage teal
  - Melaka red
  - Rainforest green
  - Andaman teal
  - Hawker-chilli red
  - Langkawi sunset
  - Cameron tea green
  - Putrajaya blush
- Sections stack like sheets, each one sliding over the last with rounded shoulders.
- Typefaces are Fraunces for display text and Manrope for UI text.
- Everything is self-hosted, so the page works with the Netlify CSP `script-src 'self'`.
- There is no scroll locking or pinning. The page respects `prefers-reduced-motion`.

## Photo animations
- **Hero:** a WebGL slideshow (three.js) with a liquid, noise-driven wipe between six HD photos, a Ken Burns drift and mouse parallax. If WebGL is unavailable, it falls back to a CSS crossfade.
- **Why Malaysia:** a statement that fills word by word, with photo "pills" opening up inside it.
- **Destinations:** an expanding photo accordion. The section colour changes with the city.
- **Services:** a list with a photo that follows the cursor.
- **Universities:** a draggable photo-card rail with a Flip filter.
- **Student Pass:** a sticky photo frame that wipes to a new photo for each step.
- **Life in Malaysia:** a five-column photo wall with parallax, plus festival cards that tilt in 3D.
- **Weekend escapes:** postcard marquees that speed up and lean with your scroll.
- **Throughout:** clip-path reveals and parallax on every feature photo.

## v12.1 additions
- **Animated backgrounds:** every section has a Malaysia-themed background, built in pure SVG and CSS. They pause when the section is off screen.
  - Why Malaysia: flag stars and crescent
  - Destinations: a map with flight routes
  - Services: woven songket
  - Universities: rainforest leaves and fireflies
  - Student Pass: Andaman waves and a plane
  - Course finder: Peranakan tile rosettes
  - Life in Malaysia: rising lanterns
  - Escapes: sunset, clouds and a wau bulan kite
  - Funding: tea hills
  - Family: bunga raya and petals
  - Stories: airmail borders and paper planes
  - FAQ: batik lines drawing themselves
- **Section dock:** a floating bar at the bottom of the screen with a photo for each section. Items grow as you hover over them, and each one has a progress ring. On phones it becomes a compact bar with up and down buttons.
- **Destinations:** a deck of postcards you can drag or flick, with a mini map of Malaysia that highlights the state.
- **What we do:** a 3D ring of service cards you can spin.
- **Top 12:** a leaderboard you can sort and filter, with a spotlight card for the selected university.
- **Family:** a plane seat map that shows who can come, plus a boarding pass with the verdict.
- **Stories:** a wall of postcards you can drag around and shuffle, written in Caveat handwriting.
- **FAQ:** "Tanya Tutee", a chat that matches your question to the right answer.
- **`universities.html`:** a directory of all 391 institutions. You can search, filter by state, type or field, and sort.
  - It opens in a new tab and has a "Back to the Malaysia page" button, which closes the tab and returns you to the landing page.
  - "Ask about this" adds the university to the enquiry form on the landing page.
  - It accepts `?q=`, `?field=` and `?state=` in the URL.
  - Data comes from `assets/js/universities-data.js`, a copy of the repo's EMGS/MQR dataset.

## v12.2 changes
- **Blended sections:** each section now fades from the previous section's colour into its own. Contents rise in on a scroll scrub. Destinations hands its city colour on to the next section.
- **Destinations background:** a night skyline of KL Tower, the Petronas Towers and Merdeka 118, with lit windows, a passing train and shooting stars.
- **Student Pass:** a flight path through seven plane windows. A plane follows your scroll along the route. Each window blind lifts to show the stage's photo, and an immigration-style step stamp thumps in. The photos are new: counsellor, offer letter, passport, plane window, departures board, graduate and office.
- **Funding:** three photo cards (Scholarships, Education loans, Vacation work) with a spinning RM coin, a staggered entrance and a 3D tilt on hover. The partner logos sit below.
- **Stories:** a cork background with Malaysian-flag bunting, fairy lights and push-pinned postcards.
- **FAQ:** the heading is now "Ask us anything." with "Tanya apa sahaja" in script. The chat sits in a Peranakan tile frame, and Malay question bubbles float in the background.
- **Free evaluation:** a two-page "study passport". The left page fills in live as you answer (name, initials, contact, level, intake, chosen university, MRZ line), and each answered step stamps the page. Sending adds "Approved for counselling". The form fields and the `/api/enquiry` payload are unchanged.
- **Directory links:** on the live site the directory still opens in a new tab. When the page is embedded in an iframe (for example a preview, which blocks new tabs), the same directory opens as an in-page panel instead. `assets/css/dirpop.css` is generated from `dir.css` and scoped to `.dirpop`. Add `?dirpop` to the URL to test the panel.

## v12.3 changes
- **Songket on every section:** the woven songket diamond and gold-sheen background from "What we do" now runs behind every section. Each section's thread colour is taken from Malaysia (flag yellow, bunga raya pink, jade, coral, Peranakan red, turmeric, tea green and so on). The colours are generated into `assets/css/songket.css` by `fx6.py`. Section-specific animations (skyline, waves, lanterns, bunting) sit on top.
- **Hero options (`hero-lab.html`):** three candidate heroes to choose from. The live hero is unchanged until one is picked.
  1. Songket mosaic: the photo is cut into diamond tiles that turn in waves to the next place and lift around the cursor (canvas).
  2. Photos in letters: a giant MALAYSIA where each letter is a window onto a different place.
  3. Floating gallery: photos fly toward you in 3D around the title, and the nearest one becomes the background.
- 11 new HD photos (`hx-*.jpg`): Merdeka 118, Petronas at night, Perhentian, Putra Mosque, Sky Bridge, Melaka River, Kek Lok Si, Batu Caves, Lord Murugan, George Town mural, Sultan Abdul Samad.

- Content and data are shared with earlier editions: QS 2027 ranks, EMGS and MQR data, the FAQ and testimonials.
- The form posts JSON to `/api/enquiry` with the original field names.

## Before launch
- Re-check the stats (99%, 5k+, 200+).
- Re-check the Graduate Pass details for Indian nationals.
- Photos come from Unsplash under the Unsplash License. University cards show Malaysia, not the specific campus.
