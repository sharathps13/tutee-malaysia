# Photo credits

All four photographs are Malaysian subjects sourced from Wikimedia Commons. Two
are **CC BY**, which makes the footer credit line a licence obligation rather
than a courtesy; the other two are **CC0** and are credited anyway, as on the
other pages. The line is rendered from the `data-photo-credit` element and
generated from `PHOTO_CREDIT` in `_tooling/localise_my.py`. If you swap any
photo, update this file **and** that constant, then re-run `localise_my.py`,
`assemble.py malaysia` and `build_unipage.py malaysia`.

CC BY-SA, NC and ND images were deliberately avoided, as on the other eight
pages. That rule cost several otherwise ideal candidates here: most of the best
high-resolution Petronas Twin Towers frames on Commons are CC BY-SA, as are the
strongest Batu Caves staircase frames and most Putra Mosque exteriors.

Each file was cropped and resized from the Commons original with `sips`. The
output dimensions match the Singapore, French, Australian, New Zealand, German,
Irish and Canadian files, which in turn match the slots, so the layout cannot
shift.

The four subjects sit in **four distinct places** — Kuala Lumpur, Putrajaya,
Melaka and Penang — which is the same spread the other pages keep.

**No photograph has an identifiable person as its subject** — the same rule the
other eight pages follow. The KLCC and Perdana Putra frames are empty of people.
The Kek Lok Si frame has two visitors by the fountain, tens of metres off and a
few pixels tall at the delivered size. The Melaka River frame is the closest
call in the set: it carries pedestrians on the far bank and passengers in a
river cruise boat, but they are incidental to a subject that is unmistakably the
river and its shophouse frontage, and at the delivered 1400 px — rendered at
roughly half that — no face is resolvable. This is the same judgement the
Singapore page's Gardens by the Bay panel and the French page's Place de la
Sorbonne hero rest on.

---

## students-campus.jpg — hero (`#home`), 1200×1143

> **The filename does not describe the subject**, and it is kept because
> `students-campus.jpg` is a literal key in the compiled stylesheet — the class
> `bg-[url('/assets/img/photos/students-campus.jpg')]` plus the matching escaped
> selector and `url()` in `assets/css/main.css`, and the `<link rel="preload">`
> in the page shell. Renaming the file means editing all of those together;
> `verify_site.py` fails on a mismatch, the browser fails silently.

- **Depicts:** the Petronas Twin Towers at dusk, with the Suria KLCC podium, the
  Four Seasons Place tower and KLCC Park in the foreground.
- **Commons file page:** https://commons.wikimedia.org/wiki/File:The_Twins_SE_Asia_2019_(49171985716).jpg
- **Author / photographer:** James Kerwin
- **Licence:** CC BY 2.0 — https://creativecommons.org/licenses/by/2.0
- **Attribution required:** **yes**
- **Crop:** original 8472×5648 (exactly 3:2) → `sips -c 5648 5930` (1.0499:1,
  centred) → resized to 1200×1143, quality 82.
- **Why a centred crop is right here:** the photographer squared up on the
  towers, so both spires, the skybridge and the podium below sit on the frame's
  vertical axis. The 1271 px trimmed from each side is further office towers
  that repeat, so nothing identifiable is lost.
- **Why 1.05:1 and not the original 3:2:** the hero panel measures about
  **596×584 CSS px on desktop (1.02:1) and 319×292 on mobile (1.09:1)** —
  essentially square at every breakpoint. The div is `bg-cover bg-center`, so a
  1.5:1 file would have a third of its width thrown away. A near-square crop
  suits this subject unusually well, because the towers are a vertical pair.
- **Safe to reshape:** referenced only as a CSS `background-image` and a
  `<link rel="preload">` — there is no `<img>` tag for it on either page, so its
  ratio has no effect on layout.

## team-working.jpg — `#relocate` ("The Pathway to Settlement"), 1400×933

- **Depicts:** Perdana Putra, the Prime Minister's office, at the head of
  Persiaran Perdana in Putrajaya.
- **Commons file page:** https://commons.wikimedia.org/wiki/File:PerdanaPutrajaya.jpg
- **Author / photographer:** Gaodanielbo
- **Licence:** CC0 — https://creativecommons.org/publicdomain/zero/1.0
- **Attribution required:** no (credited anyway)
- **Crop:** **none.** The original is 5472×3648, which is exactly 3:2, so it was
  only resized to 1400×933 at quality 82. Nothing is cropped away.
- **Note:** this image is rendered with `w-full h-auto object-cover`, so **its
  aspect ratio drives the layout**. Any replacement must also be 3:2. That the
  source was already exactly 3:2 is why this is the only file in the set with no
  crop step — the same happy accident the Singapore page had.
- **Why the seat of government for the settlement panel:** the section is about
  moving from a Student Pass to a Graduate Pass to an Employment Pass and
  eventually Permanent Residence. Every one of those is an Immigration
  Department decision, and Putrajaya is where that administration sits.

## family.jpg — `#relocate` ("Relocating with Your Family?"), 1400×1050

- **Depicts:** the Melaka River through the old town, with the restored
  shophouse frontage on the east bank and a river cruise boat mid-channel.
- **Commons file page:** https://commons.wikimedia.org/wiki/File:Melaka_(Malacca)_River.jpg
- **Author / photographer:** Engin Akyurt
- **Licence:** CC0 — https://creativecommons.org/publicdomain/zero/1.0
- **Attribution required:** no (credited anyway)
- **Crop:** original 7477×4987 (1.4993:1) → `sips -c 4987 6649` (exact 4:3,
  centred) → resized to 1400×1050, quality 82. Centred is right here because the
  river runs up the middle of the frame and the two banks balance it; trimming
  414 px from each side removes only foreground foliage on the left and blank
  embankment on the right.
- **See the note above** on the incidental figures on the far bank.

## malaysia-city.jpg — `#universities` ("Why Malaysia?") background panel, 1400×933

> Referenced by the Tailwind arbitrary-value class
> `bg-[url('/assets/img/photos/malaysia-city.jpg')]`, which is a **literal key**
> into `assets/css/main.css`. Both the class in the HTML and the escaped
> selector plus `url()` in the stylesheet must be changed together — this file
> was repointed from `singapore-city.jpg` when the shared CSS was copied over.

- **Depicts:** Kek Lok Si Temple, Air Itam, Penang — the Hall of Devas with its
  glazed roof, the lotus fountain and pagoda in the courtyard, and the
  lantern-lined terraces climbing the hillside behind.
- **Commons file page:** https://commons.wikimedia.org/wiki/File:Kek_Lok_Si_Temple_(I).jpg
- **Author / photographer:** Supanut Arunoprayote
- **Licence:** CC BY 4.0 — https://creativecommons.org/licenses/by/4.0
- **Attribution required:** **yes**
- **Crop:** original 6416×4372 (1.4675:1) → `sips -c 4277 6416` (exact 3:2,
  centred — 95 px of height removed, split between empty sky and foreground
  paving) → resized to 1400×933, quality 82.
- **Why this and not a skyline:** this slot originally carried an Ayer Itam /
  George Town view from Penang Hill (Christopher Harriot, CC BY 2.0), which was
  accurate but read as a generic tropical cityscape — the client asked for
  somewhere iconic instead. Kek Lok Si is the largest Buddhist temple in
  Southeast Asia and one of the most recognisable places in the country, and it
  is architecturally unlike the other three photographs, so the set no longer
  has two green-hillside frames in it.
- **Why Penang and not another Kuala Lumpur landmark:** the hero is already
  KLCC, and a second capital-city frame would waste the panel. Penang also holds
  the third-largest concentration of institutions in the directory, after
  Selangor and Kuala Lumpur, so the panel behind "Why Malaysia?" shows somewhere
  a reader might genuinely be choosing between.
- **People:** two visitors stand near the fountain, roughly forty metres from
  the camera and a few pixels tall at the delivered size. Incidental to the
  subject, on the same judgement as the Melaka River frame below.
