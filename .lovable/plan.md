## Flow (confirmed)

```text
User creates request (PDF attached) -> Pending
  |-> Admin opens detail -> places signature box on PDF page (drag on mobile)
  |   -> Approve: signed PDF saved, status = Approved
  |   -> Reject: status = Rejected (final)
  |   -> Needs Changes: goes back to user with comment
User (needs_changes) -> edits same request + re-uploads -> Pending again
```

## What I'll build

**1. Database (migration)**
- `profiles.signature_url` — saved signature image path (Settings upload OR captured drawing)
- `requests.signed_pdf_path` — path to the final signed PDF
- `requests.signature_meta` (jsonb) — `{ attachmentId, page, xPct, yPct, widthPct }` so placement survives re-open
- RLS update: `requests` UPDATE allowed for owner when status = `needs_changes` (edit + resubmit); admin retains full update

**2. PDF handling**
- Add `pdf-lib` (stamp signature into PDF, works in Worker/browser) and `pdfjs-dist` (render pages to canvas for placement)
- Client-side signing in the admin's browser -> upload signed PDF to `attachments` bucket

**3. Create Request**
- Restrict attachments to `application/pdf` only
- Inline helper: "Not a PDF? Convert here" -> link to `https://www.ilovepdf.com/` (opens new tab)
- Show a small "Only PDF accepted for signature workflow" note

**4. Request detail — signature placement (admin, mobile-first)**
- Pick which PDF attachment to sign (first one by default)
- Render selected page to canvas; overlay a draggable/resizable signature box (touch + mouse)
- Page selector, "Use saved signature" / "Draw new" toggle
  - Draw uses a `<canvas>` signature pad (touch friendly)
- Approve button = stamp signature onto PDF via pdf-lib, upload as `signed/<requestId>.pdf`, set status `approved` + save `signed_pdf_path` + `signature_meta`
- If already signed, show "Download signed PDF" + allow admin to re-adjust and re-approve

**5. Resubmit (user)**
- When status = `needs_changes` and viewer is owner: show "Edit & Resubmit" -> opens edit form (reuses create form), allows replacing/adding attachments, on save status flips to `pending`

**6. Settings page (new)**
- `/settings` route: upload signature PNG OR draw one; preview + clear
- Stored in `attachments` bucket under `signatures/<userId>.png`, path saved to `profiles.signature_url`

**7. Mobile-first UI**
- Replace fixed sidebar with a bottom tab bar on mobile + hamburger drawer for secondary items; keep sidebar on `md+`
- Detail page: stack columns on mobile, action buttons become a sticky bottom bar
- Inbox: table becomes card list on mobile
- Create/edit form: single column, larger tap targets
- Signature placement canvas: full-width on mobile, pinch-free simple drag (no zoom needed for v1)

## Technical notes (skip if non-technical)

- `pdf-lib` runs fully client-side; embed signature PNG via `embedPng`, draw on chosen page using stored percentages so DPI/zoom don't matter
- `pdfjs-dist` worker via `?url` import for Vite
- Signature pad implemented as a tiny custom component (no new dep needed) using pointer events -> exports `image/png` dataURL
- All storage paths keep the existing `<userId>/...` and `signatures/<userId>.png` prefixes so current RLS policies keep working; only add a `signed/` prefix policy allowing admin write + requester read

## Out of scope for this pass
- Multi-signer / signature order
- Cryptographic PKI signing (visual signature only)
- Audit log page, masters admin, notifications
