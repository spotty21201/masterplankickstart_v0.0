# MasterPlan Kickstart
## PRD —  (Foundation: 2D Land Allocation + Quick Feasibility)

**Working tagline:** *Input area → get a sensible land-use mix → see efficiency + quick feasibility.*

**Persona framing:** This PRD is written by a **senior master planner who can code**. It must satisfy both:
- real-world **planning/masterplanning criteria** (Indonesia + Southeast Asia first), and
- clear **technical implementation requirements** so a coding agent can build it fast.

**Release philosophy:** Release 0.0 is intentionally “small and sharp.” It creates a **credible baseline** that is:
- transparent (assumptions visible)
- fast (minutes to output)
- 2D-only (horizontal allocations)
- extensible (feeds future Release 0.1+)

---

## 1) Why we’re building this
Early masterplanning for Indonesian/SEA sites often starts with the same bottlenecks:
- Too many unknowns, too early
- Time wasted debating “what goes where” before a basic program makes sense
- Financial intuition scattered across spreadsheets and memory

**MasterPlan Kickstart (R0.0)** is a foundation tool to accelerate the first 30–120 minutes of any masterplan kickoff by generating:
1) a **2D Development Summary** (land-use program table), and
2) a **Quick Feasibility Snapshot** (cost → revenue → profit) using simple, editable assumptions.

This is not a “final masterplan generator.” It is a **fast decision scaffold**.

---

## 2) What “masterplan” scale this tool targets
Release 0.0 must support a wide range:
- **Small districts:** 5–20 ha (higher efficiency, fewer internal public facility obligations)
- **Medium:** 20–50 ha
- **Large:** 50–300+ ha (lower efficiency, more internal infrastructure + public realm obligations)

**Scale matters** because:
- Public facilities and ROW typically increase with size
- A small site can “borrow” amenities from surroundings; a large site must provide its own ecosystem

The tool will therefore include **scale-based presets** and **efficiency expectations**.

---

## 3) Core product scope (Release 0.0)
### 3.1 In-scope
**Layer A — 2D Land Allocation (must ship)**
- Input: **Site Area (ha)**
- Optional complexity inputs:
  - **Topography Difficulty Index** (flat → very steep)
  - **ROW width set** (one or two widths)
- Output: **Development Summary table** with:
  - land-use categories + subtypes
  - % and area (ha)
  - sellable vs non-sellable
  - basis definitions and assumptions

**Layer B — Quick Feasibility (must ship)**
- Input (simple):
  - **Land acquisition cost** (IDR/sqm)
  - **Cost rates** for key buckets (roads, residential, commercial)
  - **Selling price** assumptions by category (land sale or built product)
- Output:
  - **Total cost (CAPEX)**
  - **Total revenue**
  - **Profit** (absolute + %)
  - Simple per-ha and per-sqm metrics

**Exports (must ship)**
- CSV
- XLSX
- PDF

**Local persistence (must ship)**
- localStorage save
- export/import JSON project

### 3.2 Out-of-scope (explicit)
- 3D massing, FAR/GFA-driven vertical yield optimization
- Detailed topology ingestion (DEM), slope raster analysis
- Street network design, parcelization
- Full proforma: phasing, IRR, financing, absorption
- Multi-user accounts and permissions

---

## 4) Product principles
- **2D first:** horizontal allocation only. Vertical intensity is deliberately deferred.
- **Transparency:** every number must be explainable; assumptions visible.
- **Low cognitive load:** feels like a smart spreadsheet with guardrails.
- **Scale-aware efficiency:** rules adjust with site size.
- **Indonesia/SEA defaults:** language + categories reflect local practice (ruko, etc.).

---

## 5) Users and user stories
### 5.1 Primary users
- Masterplanner / Urban designer (kickoff)
- Development strategist / client lead (needs early feasibility)
- PM / analyst (needs repeatable outputs)

### 5.2 Core user stories
1) *As a planner, I input site area and get a sensible land-use program in 2 minutes.*
2) *As a strategist, I adjust non-sellable allocation (ROW/open space) and see efficiency instantly.*
3) *As a developer-minded user, I input land price + basic cost/selling assumptions and get a quick profit estimate.*
4) *As a team lead, I export a clean XLSX/PDF to paste into a deck.*

---

## 6) Definitions (must be consistent)
Release 0.0 must formalize basis definitions because everything downstream depends on them.

- **GSA (Gross Site Area):** boundary area.
- **NCA (Non-Constructible/Constraint Allowance):** land reserved due to slope/topography difficulty (placeholder; not a true slope model).
- **NSR (Non-Sellable / Public Realm Reserve):** roads/ROW, parks/open space, drainage/water mgmt areas, utilities land, buffers, civic if configured.
- **NDA (Net Developable Area):** **GSA − NCA − NSR**.
- **SRA (Sellable/Revenue Area):** land uses intended for sale/lease revenue.

> **Config toggle:** whether civic/institutional is counted inside NSR or as NDA.

---

## 7) The “difficulty index” (topography/constraint proxy)
Because detailed DEM/slope analysis is out-of-scope, Release 0.0 includes a **user-controlled proxy**:

### 7.1 Topography Difficulty Index (TDI)
A single selector that impacts **NCA** (constraint allowance):
- **TDI 0 — Flat / easy:** NCA 0–3%
- **TDI 1 — Gentle:** NCA 3–7%
- **TDI 2 — Rolling:** NCA 7–12%
- **TDI 3 — Steep:** NCA 12–20%
- **TDI 4 — Very steep / fragile:** NCA 20–35%

**Tool behavior:**
- Default TDI is **1 (Gentle)**.
- User can override NCA% directly.
- Show warning: “Constraint proxy. Not slope analysis.”

---

## 8) Scale-based presets (Indonesia/SEA best-practice defaults)
Release 0.0 needs **simple, believable** defaults that reflect local practice.

### 8.1 Preset families
A dropdown: **Site Scale + Context Preset**

**S1 — Small site (5–20 ha) / urban edge**
- NSR: 20–30% (often relies on surrounding services)
- Open space (inside NSR): 6–12%
- Roads/ROW (inside NSR): 12–18%

**S2 — Medium (20–50 ha) / peri-urban**
- NSR: 28–38%
- Open space: 8–15%
- Roads/ROW: 16–24%

**S3 — Large (50–150 ha) / new district**
- NSR: 35–45%
- Open space: 10–18%
- Roads/ROW: 20–30%

**S4 — Very large (150+ ha) / new town**
- NSR: 40–50%
- Open space: 12–20%
- Roads/ROW: 22–32%

> These bands are editable; tool must allow deviation but flag “Nonstandard mix.”

### 8.2 ROW width sets (simple)
To keep it 2D and fast:
- **ROW Set A (default):** Primary 24m, Secondary 16m
- **ROW Set B (optional):** Primary 30m, Secondary 20m

**Input method:** user selects a set; tool applies it as a **multiplier** to the Roads/ROW share (no geometry).

---

## 9) Land-use library (2D-only; Indonesia/SEA first)
Release 0.0 library must avoid vertical complexity. Use “areas” not FAR.

### 9.1 Buckets
**Sellable / Revenue buckets (SRA candidates):**
- Residential (2D zones)
- Commercial (2D zones)
- Employment/productive (optional)
- Mixed-use zones (2D)

**Non-sellable buckets (NSR/NCA):**
- Roads/ROW
- Parks/open space
- Water management/drainage areas
- Utilities land/easements
- Buffers
- Constraints allowance (topography proxy)

### 9.2 Residential (2D zones)
- Landed housing zone
- Cluster/townhouse zone
- Apartment zone (2D only; no height)
- Affordable/mixed-income zone (tag)

### 9.3 Commercial (2D zones)
- Ruko/strip retail zone
- Neighborhood commercial zone
- Commercial node zone (gate/node)
- Office/business zone (2D)

### 9.4 Civic/Institutional (2D)
- School zone
- Health/clinic zone
- Worship zone
- Community facilities zone

### 9.5 Special
- Cemetery/memorial zone

### 9.6 Library data fields (required)
Each item includes:
- id
- label
- group
- sellable_flag (yes/no)
- default % band by preset family (S1–S4) (optional for v0.0 but recommended)
- notes

---

## 10) Allocation engine (Release 0.0)
### 10.1 Core logic order
1) Start with **GSA**
2) Apply **NCA** from TDI (or user override)
3) Apply **NSR** from scale preset (or user override)
4) Compute **NDA = GSA − NCA − NSR**
5) Allocate **NDA** into sellable land uses (res/com/etc.) using simple default bands
6) Ensure totals reconcile and rounding preserves totals

### 10.2 Default sellable mix (Indonesia/SEA baseline; editable)
Within **NDA**:
- Residential: 50–70%
- Commercial: 10–20% (can go 25% for ruko-heavy)
- Civic/Institutional: 2–8% (toggle if counted in NSR)
- Special (cemetery): 0–8%
- Employment (optional): 0–15%

### 10.3 Guardrails
- If **NSR < preset min**: warn “Infrastructure/public realm risk.”
- If **Commercial > 25%**: warn “Absorption/frontage capacity risk.”
- If **NCA > 35%**: warn “Constraint-heavy site; consider different product strategy.”
- Always allow override.

### 10.4 Efficiency dashboard (must-have)
Always visible metrics:
- NCA%
- NSR%
- NDA%
- Sellable efficiency (SRA/GSA)

---

## 11) Quick Feasibility (FS-lite) module
Release 0.0 includes a simple cost → revenue → profit model.

### 11.1 Cost inputs
**Land acquisition**
- Land price (IDR/sqm) × GSA (sqm)

**Infrastructure (2D allowances)**
- Roads cost rate (IDR/sqm of roads land) OR (IDR per ha)
- Optional: drainage/water mgmt cost allowance (IDR/ha)
- Optional: utilities allowance (IDR/ha)

**Residential build cost (simple)**
Two options (user selects):
- **Option A: Land-sale model** (no vertical build cost)
- **Option B: Build-and-sell model**
  - input: average home footprint (sqm) and number of stories (1–2) as a simple multiplier
  - input: construction cost (IDR/sqm)
  - input: coverage ratio proxy for how much of residential zone becomes built footprints (simple %)

**Commercial build cost (simple)**
- Land-sale model OR build cost rate (IDR/sqm) using a simple coverage proxy

### 11.2 Revenue inputs
User chooses revenue basis per category:
- Land sale price (IDR/sqm land) OR
- Built product sale price (IDR/sqm built)

At minimum for v0.0:
- Residential selling price
- Commercial selling price
(Optional)
- Employment selling/lease proxy (can be land sale only)

### 11.3 Outputs
- Total land acquisition cost
- Total infra allowance cost
- Total build cost (if enabled)
- **Total cost**
- Total revenue
- **Profit** = revenue − cost
- Profit margin (%)
- Profit per ha (GSA)

### 11.4 Disclaimers (must display)
- “FS-lite: early-stage assumptions; not a bankable proforma.”
- “2D model: does not optimize vertical yield.”

---

## 12) UX requirements (Release 0.0)
### 12.1 Experience goals
- A user can get a usable table **within 2–5 minutes**.
- No technical jargon required.
- The tool feels like a guided calculator.

### 12.2 Key screens (minimal)
1) **Setup**
- Site area (ha)
- Scale preset (S1–S4)
- Topography difficulty (TDI)
- Optional: ROW set

2) **Program**
- See NSR/NCA/NDA breakdown
- Choose land uses (quick toggles)
- Adjust % allocations (sliders + editable table)
- See warnings and efficiency

3) **Feasibility**
- Input costs + selling prices
- Toggle land-sale vs build model
- See cost/revenue/profit summary

4) **Export**
- CSV/XLSX/PDF
- JSON save/load

### 12.3 Micro-interactions
- Totals always reconcile
- “Reset to preset” button
- “Duplicate scenario” (optional for v0.0; recommended)

---

## 13) Exports (Release 0.0)
### 13.1 CSV
- Development Summary

### 13.2 XLSX (recommended primary)
Sheets:
1) Development Summary
2) Efficiency + Basis Definitions
3) Feasibility Summary
4) Assumptions
5) Metadata (app/library/preset version, timestamp)

### 13.3 PDF
- One clean page: title, key metrics, tables

---

## 14) Data + storage (no DB)
- localStorage persistence
- export/import JSON
- Version stamp for schema

---

## 15) Engineering requirements (for coding agent)
### 15.1 Recommended stack
- Next.js + TypeScript
- Local state + localStorage
- Simple export libs (CSV/XLSX/PDF)

### 15.2 Core functions (must implement)
- `computeAreas(GSA, TDI, NSR%, allocations%)`
- `validateBands(preset, values)`
- `rebalanceToPreset(preset, lockedItems)`
- `roundPreserveTotals(values)`
- `computeFeasibility(costInputs, revenueInputs, areas)`

### 15.3 Testing (minimum)
- Unit tests for allocation engine + rounding
- Regression tests replicating sample examples

---

## 16) Example (model) — simplest walkthrough
**Input:** 100 ha, S3 Large, TDI 1
- NCA = 5% (example) → 5 ha
- NSR = 40% → 40 ha
- NDA = 55 ha

**NDA allocation (editable):**
- Residential 60% → 33.0 ha
- Commercial 15% → 8.25 ha
- Civic 5% → 2.75 ha
- Cemetery 3% → 1.65 ha
- Other/Employment 17% → 9.35 ha

**FS-lite:**
- Land price input (IDR/sqm)
- Infra cost rate for roads land
- Selling prices for residential/commercial land
- Output profit summary

---

## 17) Definition of Done (Release 0.0)
- User enters only area (plus preset) and gets a coherent Development Summary.
- Efficiency dashboard shows NCA/NSR/NDA and sellable efficiency.
- FS-lite module computes cost/revenue/profit without errors.
- Exports work (CSV/XLSX/PDF) and are presentation-ready.
- JSON save/load works.
- Assumptions are visible and exported.

---

## 18) Roadmap bridge to Release 0.1+
Release 0.0 must be designed so Release 0.1 can add:
- entrance logic
- composition templates (gate/core/ring)
- richer land-use library
- more robust CAPEX module
- geometry import (GeoJSON/KML)

