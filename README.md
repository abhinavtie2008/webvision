# Sarathi — concept redesign (unofficial demo)

An independent, unofficial redesign of the Sarathi Parivahan driving-licence portal.
It is **not** a Government of India website, it is not affiliated with the Ministry of
Road Transport and Highways, and it processes no real applications, payments, Aadhaar
numbers, OTPs or documents.

Everything runs on this machine. Data lives in `server/data/sarathi.db`, uploads in
`server/uploads/`. Use sample data only — never enter real personal information.

---

## What it is

A full-stack prototype of the **New Learner Licence** journey:

- 7-step wizard: eligibility → personal details → documents → review → payment → test slot → done
- Server-side draft autosave with optimistic concurrency
- Validated document uploads (magic bytes, MIME, size)
- Idempotent mock payment + receipt
- Live slot availability with transactional booking
- Public status page, OTP resume across devices
- English and Hindi, switched at runtime

Stack: React 19 + TypeScript + Vite 7, Express 5, Node's built-in `node:sqlite`
(no native modules to compile). Custom CSS, no UI framework.

```
src/            React app (pages, components, i18n, styles)
server/         Express API, SQLite schema, seed data, tests
scripts/        check-i18n.mjs (translation key audit)
dist/           production build output (local only)
```

---

## Run it

Requires Node 24+ (the API uses the built-in `node:sqlite`).

```bash
npm install
npm run dev          # API on :4000, web on :5173
```

Open <http://localhost:5173>.

Production-style run from one port:

```bash
npm run build
npm start            # serves dist + API on :4000
```

Other commands:

```bash
npm test             # 15 API tests (Node test runner)
npm run check:i18n   # fails on duplicate or missing translation keys
npm run reset        # wipe demo data, keep the service catalogue and slots
```

### Demo values

| Thing | Value |
| --- | --- |
| OTP for resume | `123456` (also shown on screen) |
| Demo card | `4242 4242 4242 4242`, any future expiry, any CVV |
| Declined payment | tick “Simulate a declined payment”, or use card `4000 0000 0000 0002` |
| Seed centres | Five Delhi zonal offices, ten days of slots |

---

## What changed, and why

The audit below is what the redesign is based on (the same list is on the in-app
**About** page). “Seen” means observed on the live public portal on 30 Oct 2026.

| # | Problem seen | What this prototype does instead |
| --- | --- | --- |
| 1 | Direct links returned 403; state selection lived only in the session | Real URL per service and per application; state is stored in the draft, not used as a gate |
| 2 | ~20 home tiles and dozens of dropdown links, no search | One searchable, filterable service list with fee, time and documents before you start |
| 3 | Static multi-step text with no progress or save | Seven-step wizard with a progress rail, autosave and OTP resume |
| 4 | Payment verification was a separate service citizens had to remember | Payment, receipt, slot and test on one timeline at one status URL |
| 5 | Blocking contactless modal, chat widget and moving banners | No blocking overlays, no auto-moving banners, dismissible notices only |
| 6 | Zoom disabled, 14px text, 24px state links | Zoom enabled, 17px base text, 44px targets, visible focus |
| 7 | Service names and instructions were English-only and inconsistent | Full English/Hindi switch including errors, with the page language declared |
| 8 | Duplicate/retried payments risked a double charge; last-seat races broke the page | Idempotency keys and transactional slot checks return a clear conflict instead |
| 9 | Almost no server-side validation on uploads | Magic-byte, MIME and size checks per document type, with readable error codes |
| 10 | No way to resume on another device; slot data was stale | Reference + OTP resume from any browser, live seat counts re-checked on booking |

Backend fixes implemented in this demo:

1. **Idempotent payments** — an `Idempotency-Key` is stored with a UNIQUE constraint; replaying a request returns the original receipt, not a second charge.
2. **Server-owned amount** — the fee comes from the service record, not from the browser.
3. **Optimistic concurrency on drafts** — a stale tab gets `409 VERSION_CONFLICT` instead of overwriting newer data.
4. **Atomic slot booking** — `BEGIN IMMEDIATE` + seat check; a full slot returns `409 SLOT_FULL` with a next step.
5. **Rate-limited OTP resume** — expiry, attempt limits, and mobile masking (`••••••1234`) on the public status view.
6. **Magic-byte document validation** — extensions are not trusted; stored file names are generated, not user-supplied.
7. **One error contract** — `{ error: { code, message, fields } }` with correct HTTP status codes.
8. **Audit timeline** — every meaningful action is recorded; no third-party trackers.

---

## Handover notes

- `dist/` is a local build artifact and is **not** meant to be committed or uploaded.
- This folder is not a git remote checkout; nothing here has been pushed, tagged or released.
- Copy individual files into your repository by hand if you want to publish it — review each file first.

---

## Manual test script

Run `npm run dev` first (or `npm run build && npm start` and use port 4000).
Work top to bottom; each step lists what you should see.

1. **Home loads.** Open <http://localhost:5173>. Expect the navy hero, search box, three primary service chips, a service grid with fee and time on each card, and the “Recent application” card absent (no applications yet).
2. **Search filters.** Type `renew` in the hero search and press Enter. Expect the catalogue to scroll into view and filter; the result count reads “1 service”. Clear the field — all services return.
3. **Category filter.** Click the **Learn to drive** chip. Expect the grid to filter and the chip to stay highlighted. Click *All* to reset.
4. **Service page.** Open **Learner licence**. Expect a sticky summary card with fee (₹500), time, documents required and a “Start application” button, plus the four-step “what you need” list.
5. **Start the wizard.** Click **Start application**. Expect step 1 of 7, a reference like `DL-2026-XXXXXX`, and the stepper showing the current step.
6. **Eligibility → details.** Keep the defaults (General, no licence, LMV) and click **Continue**. Expect step 2. Change any field and watch the “Saved …” indicator appear within a second.
7. **Validation.** Clear *Mobile number* and click **Continue**. Expect focus to move to an error summary listing the field; the input is marked invalid with a message. Fix it and continue.
8. **Documents, bad file.** On step 3, upload a `.txt` renamed to `.png`. Expect a readable “file type not allowed” error and no document card. Upload a real JPG/PNG and a PDF instead — expect a card with the file name, size, date and a working **View** link.
9. **Declaration gate.** Continue to **Review**. All entered data and documents should be listed with **Edit** links. Click **Submit application** without ticking the declaration. Expect a focused error summary (“1 field needs attention”) and the checkbox outlined in red.
10. **Submit → payment.** Tick the declaration and submit. Expect the payment step, status “Submitted — payment due”, and a breakdown of ₹200 + ₹300 = ₹500 computed by the server.
11. **Declined payment.** Click **Fill demo card**, tick **Simulate a declined payment**, then **Pay**. Expect “The gateway declined this payment.” and no charge; you stay on the payment step.
12. **Successful payment.** Untick the decline box and pay again. Expect the slot step, status “Paid — book your test slot”, and live seat counts per time.
13. **Book a slot.** Pick a centre, a date and a time (e.g. 10:30, “4 seats left”), then **Confirm this slot**. Expect the done screen with reference, receipt number, `•••• 4242`, slot date/time and address. The booking is now on the status page and cannot be changed from the wizard.
14. **Status page.** Click **Open status page**. Expect the reference as the page title, the masked mobile (`••••••1234`), a progress rail with five completed stages, the timeline including the declined attempt, documents, payment breakdown and the booking card.
15. **Deep link.** Reload the status page (F5). It must load directly — no 404, no blank page.
16. **Resume by OTP.** Click **Resume with OTP** (or open `/resume`). Enter the reference, click **Send code**, then **Fill demo code**. Expect the wizard to reopen on the last step. A wrong code gives a readable error; repeated wrong codes lock the challenge until you request a new one.
17. **Unknown reference.** Visit `/status/DL-9999-ZZZZZZ`. Expect a “not found” error block, a retry button, the form prefilled with what you typed, and your recent applications listed below.
18. **Hindi.** Click **हिं** in the header. Expect every label, error and timeline entry to switch, and `<html lang="hi">`. Reload — Hindi persists.
19. **Reset.** Open **About the concept** → **Reset demo data** → accept. Expect a confirmation message, then a home page with no recent application and no data under `/status`.
20. **404 and keyboard.** Visit `/nope`. Expect a 404 page with Home and Status buttons. Press Tab from the top: the skip link appears first and jumps to main content; focus rings are visible throughout.
21. **Narrow window.** Resize the browser to ~390px wide. Expect no horizontal scrolling, a compact stepper (dots, no clipped labels), and the menu under the hamburger button.
22. **Print.** On a status page, press Ctrl+P. Expect a clean print preview: no nav, no footer clutter, masked mobile and timeline intact.
23. **Automated checks.** Run `npm test` → **15 passing**. Run `npm run check:i18n` → **OK — no duplicate or missing keys**. Run `npm run build` → clean TypeScript build.

---

## Known limits

- Payments, OTP, Aadhaar and SMS are simulated. Nothing leaves this machine.
- The service catalogue, fees and centres are illustrative, not current official data.
- Sign-in, real identity verification, and state-specific fee rules are out of scope.
- `node:sqlite` is still flagged experimental on some Node releases; the warning is harmless.
- Only the New Learner Licence journey is wired end to end; other service pages are entry points.
