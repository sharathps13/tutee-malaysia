# Tutee Connect — Study in Malaysia

The Malaysia destination page. Country #9, built 2026-09-02 from the UK
fragments by the shared toolchain in `../_tooling/`.

```
index.html            the landing page          (generated — do not hand-edit)
universities.html     the directory page        (generated — do not hand-edit)
assets/js/*.js        main.js, services-data.js, universities-data.js
                                                (all generated)
api/enquiry.py        the enquiry -> email function (installed, byte-identical
                      to _tooling/serverless/enquiry.py)
assets/img/photos/CREDITS.md   photo licences and the exact crops used
serve.py              static preview server (returns 501 for the form POST)
```

**Everything here is generated.** Editing `index.html` gets overwritten on the
next build. Edit `../_tooling/localise_my.py` (copy), or
`../_tooling/build_dataset_my.py` (the institution dataset), and rebuild:

```bash
cd "../_tooling"
python3 build_dataset_my.py          # dataset from the vendored register snapshots
python3 build_dataset_my.py --refresh    # ...re-downloading both registers first
python3 localise_my.py               # fragments-malaysia/ + main.js + services-data.js
python3 assemble.py malaysia
python3 build_unipage.py malaysia
python3 verify_site.py malaysia
python3 check_twins.py malaysia      # what the localiser left unlocalised (baseline 40)
```

Preview at <http://localhost:8008> via `Start All Sites.command`, or
`python3 ../_tooling/devserver.py malaysia --port 8008` (use `devserver.py`, not
`serve.py`, if you need the enquiry form to POST).

The full content spec — every visa name, figure and source — is
`../_tooling/MALAYSIA_SPEC.md`. Read that before changing any copy.

---

## The directory: 391 institutions, and why it is exactly the right list

**EMGS is the gate, not a directory.** Every international student pass for
Malaysia goes through Education Malaysia Global Services: the institution lodges
the application, EMGS issues the eVAL (Visa Approval Letter), and the
Immigration Department endorses the Student Pass against it. An institution that
is not registered with EMGS has no route to apply at all.

So EMGS registration **is** the permission — the same relationship CRICOS has in
Australia and Code-of-Practice signatory status has in New Zealand. The reference
card's hardcoded `Intl. Admits: Yes` is literally true here and needs no
editorial judgement.

397 institutions on the register; **391 listed**. Six excluded, none on a
judgement about quality: two foreign ministries and a foundation that *sponsor*
students rather than teach them, two campuses outside Malaysia (London and
Malta), and one row that is a person's name. The exclusion list is asserted in
the builder, so a register update cannot quietly change it.

## What is real data here, and what is not

Nothing on this page is an invented per-institution statistic. In particular
there is **no equivalent of the UK page's `offerRate`** — still flagged as a
launch risk in `../UK/README.md`. The rate slot carries `accredited`, the
institution's real count of MQA-accredited programmes on the **Malaysian
Qualifications Register**, and the UI labels it "MQA accredited" so it can never
be read as a selectivity figure.

**283 of 391 institutions carry a count. 108 show `n/a`.** That is deliberate on
both sides: `n/a` rather than `0`, because the MQR lists *fully accredited*
programmes only and an absence is not evidence of none; and 108 rather than a
smaller number because the EMGS↔MQR name join is tuned for **precision over
coverage**. A wrong join prints another institution's programme count as this
one's, which is worse than admitting the gap.

`programs` — the three commonest fields of study — comes from MQA's own NEC
(National Education Code) classification of those same programmes, and is left
empty rather than guessed where the institution is unmatched.

## Three joining traps this page had to solve

Worth reading before touching `match_mqr` in the builder; all three shipped a
wrong number before they were closed.

1. **Generic words are not evidence.** Malaysian institution names are built
   from a small shared pool — *university, Malaysia, technology, science,
   international*. Plain token containment matched **Universiti Malaya** to
   **Universiti Malaya-Wales**, and **University of Technology Malaysia** to
   **Malaysia University of Science and Technology**. Different institutions in
   both cases. The rule now requires the *discriminating* tokens to agree, and
   permits extra tokens only when they are Malaysian place names — i.e. a campus.

2. **One university, several campus rows.** MQR lists UNITEN only as "Kampus
   Putrajaya" and "Kampus Sultan Haji Ahmad Shah"; stopping at the first match
   credited it with 28 programmes instead of 128. All campus rows are now
   collected — and a second pass hands each campus back to the branch EMGS
   registers separately, so UiTM's main row keeps its own 456 and does not
   swallow its five branch campuses.

3. **The two registers write names in different orders.** EMGS writes "HELP
   University", MQA writes "Universiti HELP". Matching is therefore also tried
   on the sorted token set — and a row matching on its **full** registered name
   beats one that matched only after a campus qualifier was stripped, or HELP
   University's programmes land on its Damansara Heights campus instead.

## The register's own two errors

This is the messiest register in the set so far, and the builder corrects both
faults from the register's own data rather than by hand:

* **The state tag is wrong on a large minority of rows.** It files USM — which
  is in Gelugor, Penang — under Kuala Lumpur, along with every other public
  university, and puts UCSI University and Sunway College in Johor. The state is
  therefore derived from the **postcode** in the address EMGS itself publishes,
  because Pos Malaysia allocates postcodes by state. That resolves 331 of 391;
  the rest fall back in order to a state named outright in the address, then
  MQA's record, then a town name, and only last to the tag.

  Three rows publish no street address at all, only "Wilayah Persekutuan Kuala
  Lumpur" — the university's KL liaison office. For UM that is also the campus,
  but it placed **UTM in Kuala Lumpur instead of Skudai, Johor** and **UUM in
  Kuala Lumpur instead of Sintok, Kedah**, which the directory's region filter
  would have got wrong too. Both are corrected to the campus QS publishes, and
  the builder asserts the override is still needed — so a row that gains a real
  address fails the build rather than being silently overridden.

* **The category tag is blank on 38 rows and contradicts the name on 7 more.**
  It files MAHSA University and SEGi University as colleges, and three "Kolej
  Universiti" as universities. The builder prefers the **name**, because what a
  Malaysian institution may call itself is regulated: under the Private Higher
  Educational Institutions Act 1996 the styles "university", "university
  college" and "college" each require the matching approved status. The two
  categories the name cannot express — *Foreign Branch Campus* and the
  polytechnic/community-college sector — still come from the tag.

Two public universities are also **displayed under their own name** rather than
the register's Anglicisation, which neither the institution, MQA nor QS uses:
`University of Technology Malaysia` → **Universiti Teknologi Malaysia (UTM)**,
and `University of Malaysia, Sarawak` → **Universiti Malaysia Sarawak (UNIMAS)**.
The register spelling stays searchable through `alt`.

## Ranking

**QS World University Rankings 2027**, published 18 June 2026, covers **32**
Malaysian institutions — comfortably past the twelve cards the home-page
carousel renders. So unlike New Zealand (cards 9–12) and Singapore (cards 5–12),
**no card needs rebadging**: every one carries a rank it really holds, and the
reference DOM's hardcoded `Rank #N` is untouched. `localise_my.py` asserts that,
so a future dataset that pushes an unranked institution into the first twelve
fails the build instead of asserting a position.

31 of the 32 appear here. The exception is **Universiti Kuala Lumpur**, which QS
ranks as one university at 1401+ while EMGS registers only its six institutes
(BMI, MFI, MSI, MICET, MIMET, RCMP) and no umbrella row. Giving a
whole-university position to one institute would assert a ranking it does not
hold, so none of them takes it.

Note the shape of the top twelve: the five MOHE research universities, then
**seven private institutions**. Malaysia is the only destination in this set
where private universities reach the carousel on merit.

## Country-specific build notes

| | |
|---|---|
| currency | Malaysia uses the **ringgit (RM)**, and no icon set — lucide included — has a ringgit glyph. The two icons involved are the decorative "Financial AID" marker, so `swap_currency` is `'ringgit'` and both become lucide **`banknote`**: a real glyph in the same family that is currency-neutral. A `$` would be as wrong here as on the UK page. `services-data.js` ships the pound glyph inline and gets the same swap, with an assertion that no pound survives — the fix Canada never got. |
| spelling | British `-ise`, and **`programme`**. Malaysian government and MQA usage; matches the UK, Ireland and Germany, unlike Canada, Australia and Singapore. |
| DOM fidelity | The only structural differences from the UK page are the two currency glyphs (2 elements fewer) and the city-image class token. Every animation class — 973 instances across 72 distinct classes — is identical, and `main.js` has **no functional change** to the reveal, carousel or observer code. |
| search | `alt` carries acronyms, the Malay/English twin of each name and the state. Folding **deletes apostrophes** rather than turning them into spaces, so that "taylors" finds *Taylor's University* — carousel card #7. Every other punctuation run still becomes a single space, so "segi" finds "SEGi". |

## The Duolingo exception

Malaysia is the one page in this set that names the **Duolingo English Test on
purpose** — and names it *in the negative*. EMGS publishes the tests it accepts
for a Student Pass (MUET, IELTS, TOEFL iBT, PTE Academic, Cambridge English,
ELS) and Duolingo is not among them, so a student who asks the chat about it is
told outright rather than given an answer that quietly omits it. Sitting the
wrong test costs a season. Ireland names it because ISD genuinely accepts it;
every other page simply drops it.

The sentence is whitelisted in `verify_site.py`'s `allow` list for this country,
and `localise_my.py` asserts it is still present.

## Things a reviewer should check before launch

* **The Graduate Pass is nationality-limited and time-limited.** It is open to
  32 nationalities, and for **Indian and Chinese nationals it is decided
  case-by-case and currently authorised only until 31 December 2026**. Tutee
  Connect's audience is substantially Indian, so **this date needs re-checking
  before launch and again after it**. The page states the condition; it will be
  wrong the moment EMGS changes or extends it.
* **Undergraduate dependants.** Postgraduates may bring family; undergraduates
  may only do so on 17 listed nationalities, and **India is not one of them**.
  Same review cadence.
* **QS 2027** is current as of this build. The UK, Canadian, Irish, German, New
  Zealand and Australian pages still cite QS 2026 and are one edition stale.
* **The 6% service tax** on private-institution tuition for international
  students took effect 1 July 2025 and is quoted in the chat's cost answer.
