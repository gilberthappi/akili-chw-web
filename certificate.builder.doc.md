# Certificate Builder — Implementation Plan (1-Week MVP)

## Goal

Build the full UI shell first — all panels, canvas area, toolbar, element list — with static/mock data. Then wire features one by one against the real UI.

---

## Stack

| What | Tool |
|------|------|
| Canvas editor | `fabric` (install) |
| PDF export | `jsPDF` (already installed) |
| QR codes | `qrcode` (install) |
| Image uploads | Cloudinary (already configured) |
| DB | Prisma + PostgreSQL (already configured) |
| API | tsoa controllers (existing pattern) |

**Install:**
```bash
# akili-chw-web
pnpm add fabric qrcode
pnpm add -D @types/fabric @types/qrcode

# akili-chw-api
pnpm add qrcode
pnpm add -D @types/qrcode
```

---

## Dynamic Tokens

| Token | Replaced With |
|-------|--------------|
| `{{studentName}}` | CHW full name |
| `{{studentCode}}` | Student ID |
| `{{courseName}}` | Course title |
| `{{courseDuration}}` | Duration |
| `{{startDate}}` | Start date |
| `{{endDate}}` | End date |
| `{{instructorName}}` | Instructor name |
| `{{currentDate}}` | Issue date |
| `{{certificateCode}}` | Unique cert ID |

---

## Database Schema (akili-chw-api)

```prisma
model CertificateTemplate {
  id          String   @id @default(uuid())
  name        String
  orientation String   @default("LANDSCAPE")
  canvasJson  Json
  thumbnail   String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Certificate {
  id         String   @id @default(uuid())
  code       String   @unique
  templateId String
  userId     String
  courseId   String
  pdfUrl     String
  issuedAt   DateTime @default(now())
  metadata   Json

  template CertificateTemplate @relation(fields: [templateId], references: [id])
  user     User                @relation(fields: [userId], references: [id])
  course   Course              @relation(fields: [courseId], references: [id])
}
```

---

## API Endpoints (akili-chw-api)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/certificate-templates` | List templates |
| `POST` | `/certificate-templates` | Create template |
| `GET` | `/certificate-templates/:id` | Get by ID |
| `PUT` | `/certificate-templates/:id` | Save canvas JSON |
| `DELETE` | `/certificate-templates/:id` | Delete |
| `POST` | `/certificates/generate` | Generate + store certificate PDF |
| `GET` | `/certificates/:code/verify` | Public verification |

---

## Frontend Structure (akili-chw-web/src)

```
src/pages/CertificateBuilder/
  index.tsx                  # Route entry
  CertificateBuilderPage.tsx # 3-panel layout
  components/
    TemplateList.tsx          # Left — saved templates list + create button
    Canvas.tsx                # Center — Fabric.js canvas + ruler
    ElementsPanel.tsx         # Right — Elements tab
    BackgroundsPanel.tsx      # Right — Backgrounds tab
    Toolbar.tsx               # Top — zoom controls, save, generate mock PDF
    ElementControls.tsx       # Floating bar when element is selected
  hooks/
    useFabricCanvas.ts        # Fabric.js init, resize, cleanup
    useCanvasElements.ts      # Add/update/delete elements
    useTemplateSync.ts        # Load/save template JSON via API
  utils/
    tokens.ts                 # Token list + sample values for mock
    exportPdf.ts              # canvas.toDataURL() → jsPDF → download
```

---

## Implementation Order

### Step 1 — Full UI Shell (static, no real data)
Build every screen and panel with hardcoded/mock data so the full layout is visible and reviewable.

- [ ] Route `/certificate-builder` added to router
- [ ] 3-panel page layout: left sidebar (fixed width) | center canvas area (flex) | right panel (fixed width)
- [ ] **Left panel** — `TemplateList`: mock list of 3-4 template cards with name + placeholder thumbnail, "+ New template" button
- [ ] **Center** — `Canvas`: white rectangle representing the certificate canvas, ruler lines top/left, orientation label
- [ ] **Right panel** — tabs: "Elements" and "Backgrounds"
  - Elements tab: sections (CERTIFICATE, COURSE, STUDENT, INSTRUCTOR) each with clickable element chips (Text, Image, QR code, Certificate code, Current Date, Course name, Details, Progress, etc.)
  - Backgrounds tab: color swatches + "Upload image" button (static)
- [ ] **Toolbar** — top bar: template name (editable), orientation toggle (LANDSCAPE/PORTRAIT), zoom `-` `100%` `+`, "Generate Mock Certificate" button (disabled for now)
- [ ] **Element selected state** — `ElementControls`: floating toolbar with font size, bold, italic, color picker, align, delete (show when clicking a placeholder element)
- [ ] Mobile guard: show "Certificate builder is only available on desktop" on small screens

### Step 2 — Canvas Init (Fabric.js)
- [ ] Install `fabric` and wire real Fabric.js canvas into `Canvas.tsx`
- [ ] `useFabricCanvas` hook: init, handle container resize, cleanup
- [ ] Canvas size matches orientation (landscape: 1056×816, portrait: 816×1056)
- [ ] Zoom in/out toolbar buttons work

### Step 3 — Add Elements to Canvas
- [ ] Clicking element chip → adds Fabric.js object to canvas (IText for text, Rect placeholder for image, etc.)
- [ ] Dynamic token chips add a styled text box with the token e.g. `-Student name-`
- [ ] `useCanvasElements`: add, select, move, delete
- [ ] `ElementControls` wired to selected Fabric object (font size, color, bold, delete)

### Step 4 — Save & Load Templates (API)
- [ ] Backend: Prisma schema + migration + tsoa CRUD endpoints
- [ ] `useTemplateSync`: debounced auto-save canvas JSON on change
- [ ] Load template: `canvas.loadFromJSON(template.canvasJson)`
- [ ] Left panel: fetch real templates from API, click to load
- [ ] Create new template: modal with name + orientation → POST → load empty canvas
- [ ] Delete template

### Step 5 — PDF Export
- [ ] "Generate Mock Certificate": replace tokens with sample data, `canvas.toDataURL()` → jsPDF → browser download
- [ ] Thumbnail: snapshot canvas as image → show in left panel template card

### Step 6 — Backend Certificate Generation (Post-UI)
- [ ] `/certificates/generate` endpoint: fetch template JSON, replace tokens with real user/course data, generate PDF via `pdf-lib`, upload to Cloudinary, save `Certificate` record
- [ ] QR code embed in PDF via `qrcode`
- [ ] Public `/verify/:code` page

---

## Deferred (Post-MVP)

- Course completion trigger → auto-generate certificate
- Student profile certificate download page
- Link certificate template to specific course ("Link Certificates" tab)
- Email delivery
- Background image upload
- Duplicate template
