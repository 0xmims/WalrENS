# PRD — WalrENS (ENS ↔ Walrus Developer Tool)
**Version:** 0.3  
**Owner:** Darren Mims  
**Date:** 2025-08-16 (America/New_York)

---

## 1) Summary & Goals
**One-liner:** A tiny SDK + CLI + gateway that lets any **ENS** name (or subname) resolve to **Walrus** blobs or static sites.

**DX example:**  
`npx walrens link mysite.eth ./dist` → uploads to Walrus, writes an ENS record, and your site is live at `https://mysite.eth.walrus.tools/`.

**Primary goals**
- Ship a new, open-source dev tool that **uploads to Walrus** and **binds** the result to an **ENS** name in one command.
- Provide a **read path** (SDK + HTTP gateway) so apps/browsers can resolve `name.eth → Walrus blob/site`.
- Deliver a polished demo + docs that meet the ETHGlobal **Walrus Dev Tool** and **ENS** prize criteria.

**Why this is a weekend build**
- No new contracts required; small surface (CLI/SDK/Worker); simple end-to-end demo.
- Stretch items (contenthash codec, L2 Primary Names) are optional and modular.

---

## 2) Success Metrics (Hackathon)
- ✅ CLI publishes a demo site to Walrus and writes ENS metadata end-to-end on testnet.
- ✅ Gateway serves `https://<ens>.walrus.tools/` with **<200ms p95** overhead after warm cache.
- ✅ Repo includes README + 2-minute demo video + architecture diagram.
- ✅ Meets Walrus tool and ENS prize bars (functional, obvious ENS value; no hard-coded values).

---

## 3) Scope
### In-scope (MVP)
- **CLI:** `walrens link <ens> <path|file>` → upload to Walrus → write ENS **Text record** key `walrus`.
- **SDK (TS):** publish & resolve helpers.
- **Gateway (Cloudflare Worker):** `/:ens/*path` → ENS lookup → Walrus fetch → cache → serve.
- **Minimal example site** and docs.

### Stretch (optional)
- **L2 Primary Name** helper (Base/OP) using `L2ReverseRegistrar` + UI display.
- **Experimental `contenthash`** support using a `walrus://` codec (Text record remains canonical).
- **Auto-backup/reseal** script if Walrus has TTL/expiry semantics.

### Out-of-scope
- Custom ENS Resolver contracts; complex auth/billing; browser-native Walrus fetches.

---

## 4) Users & Use-cases
- **Frontend devs:** host static sites via ENS → Walrus.
- **Tooling devs:** resolve content by ENS in dapps.
- **DAOs/teams:** docs & microsites tied to existing ENS names.

---

## 5) Product Requirements
### 5.1 CLI (Node/TypeScript)
**Command:**  
`walrens link <ensName> <pathOrFile> [--network <chain>] [--text-only] [--contenthash]`

**Behavior:**
1) Upload to Walrus (file → `blobId`, directory → `siteId`).
2) Write ENS **Text record** `walrus=…` with either:
   - `blob:<id>`
   - JSON `{"type":"site","id":"<id>","index":"/index.html"}`
3) (Optional) Also set `contenthash` with experimental `walrus://<id>` encoding (documented; non-blocking).
4) Print gateway URL: `https://<ens>.walrus.tools/`.

**Errors:** clear messages for RPC failures, ENS permissions, upload limits.  
**Exit codes:** `0` success; `1` user error; `2` network error.

### 5.2 SDK (TypeScript)
- `resolveWalrusFromEns(name, { rpcUrl? }) → { type:'blob'|'site', id, index? } | null`
- `publishToEns(name, mapping, { rpcUrl?, privateKey }) → { txHash }`
- `getGatewayUrl(name, path?) → string`
- Parse `walrus` Text record values (`blob:<id>` or the site JSON).

### 5.3 Gateway (Cloudflare Worker)
- **Route:** `GET /:ensName/*path`
- **Flow:** ENS `walrus` text record → parse mapping → build Walrus fetch URL → stream → cache (ETag/`Cache-Control: public, max-age=600`).
- **Static site routing:** default `/index.html` for directory paths.
- **Observability:** simple logs; request/response timing; cache hit ratio.

---

## 6) ENS Mapping Strategy (MVP)
**Canonical:** **Text record** key `walrus`.

**Values**
- **Blob:** `blob:<id>`
- **Site:** `{"type":"site","id":"<id>","index":"/index.html"}`

**Optional:** also set `contenthash` with a `walrus://<id>` experimental codec (documented; not required for the demo).

---

## 7) Architecture

```
Dev → CLI (upload) ──HTTP──> Walrus
                    │
                    └─RPC──> ENS write (Text record; optional contenthash)
User → Gateway ──RPC──> ENS read ──HTTP──> Walrus Fetch ──→ Browser
```

---

## 8) Technical Design & Dependencies
- **Languages/Frameworks:** Node 20+, TypeScript, Cloudflare Workers.
- **Libs:** `viem` (ENS reads/writes), `zod`, `commander`, `undici`/`node-fetch`, `tsup`.
- **Build/Test:** `pnpm`, `vitest`.
- **Env vars:**  
  - `ETH_RPC_URL` — Ethereum RPC for ENS reads/writes  
  - `WALRUS_API_BASE` — Walrus read (and later upload) base URL  
  - (optional) `CF_ACCOUNT_ID` / `CF_API_TOKEN` for Worker deploy

### 8.1 Repo Layout (Monorepo)
```
/packages
  /cli            # walrens CLI
  /sdk            # resolver + publisher TS SDK
/apps
  /gateway        # Cloudflare Worker
  /example-site   # tiny static demo (index.html)
/docs             # diagrams + submission assets + PRD.md
```

### 8.2 Scripts
```
pnpm dev:gateway   # local worker
pnpm dev:cli       # CLI in watch mode
pnpm build         # build all packages
pnpm test          # unit tests
pnpm demo          # end-to-end demo script
```

---

## 9) Cursor & Claude Execution Plan

> **Add this PRD to the repo at `docs/PRD.md`. Use the tasks below one-by-one (file-scoped).**

### Task Prompt Template (for Cursor/Claude)
```
[WalrENS PRD v0.3] Implement <task name>
File: <relative/path>

Context (from PRD):
- §5.3 Gateway (route + caching) / §5.1 CLI / §5.2 SDK (pick relevant)
- §6 ENS Mapping (text record format)
- §8 Technical (env vars, deps)

Do:
- <bullet 1>
- <bullet 2>

Don’t:
- Don’t modify other files
- Don’t add deps not listed in PRD
- Keep public APIs stable

Acceptance:
- <command to run> returns 200 and serves bytes (or prints tx hash)
- Directory paths default to /index.html
- Logs show cache HIT on second request
```

### Concrete Tasks (initial four)
1. **Gateway ENS read + Walrus proxy**  
   Implement `GET /:ensName/*` reading Text record **`walrus`** via `ETH_RPC_URL`, parse `blob:<id>` or site JSON, build Walrus URL using `WALRUS_API_BASE`, proxy with caching, default `/index.html`. Remove any `ctxWaitUntil` shim and use `ctx.waitUntil` directly.  
   **Acceptance:**  
   - `pnpm dev:gateway` runs.  
   - With `walrus=blob:<id>` set on a test ENS name, `http://127.0.0.1:8787/<name>/` returns 200.  
   - Second request shows cache HIT.

2. **Wrangler env wiring**  
   Add `ETH_RPC_URL` and `WALRUS_API_BASE` under `[vars]` in `apps/gateway/wrangler.toml`.  
   **Acceptance:** Worker boots; both vars available.

3. **SDK ENS helpers**  
   Implement:  
   - `getEnsTextRecord(name,'walrus',rpcUrl?) → string|null`  
   - `setEnsTextRecord({name,key:'walrus',value,rpcUrl,privateKey}) → txHash`  
   - `resolveWalrusFromEns(name,rpcUrl?) → {type:'blob'|'site', id, index?} | null`  
   **Acceptance:** Node REPL returns parsed mapping; `setEnsTextRecord` updates the record.

4. **CLI link (demo without upload yet)**  
   `link <ens> <path>` with flags: `--id <walrusId>`, `--site`, `--rpc`, `--pk`.  
   If `--id` present, skip upload and write the ENS text record using the SDK; print `https://<ens>.walrus.tools/`.  
   **Acceptance:** Running:  
   ```
   node packages/cli/dist/index.js link yoursub.yourname.eth apps/example-site \
     --id DEMO123 --site --pk 0x... --rpc https://...
   ```  
   updates the ENS record and prints the gateway URL.

*(Add Walrus upload as a 5th task once the upload endpoint/format is confirmed.)*

---

## 10) Milestones & Timeline (Fast Track)
- **M1 — Core ENS read/write + gateway** (4–6h)
- **M2 — CLI link with `--id` + swap to real upload** (4–6h)
- **M3 — Example site + SDK polish** (3–4h)
- **M4 — Docs + demo video + deploy** (2–3h)
- **Stretch — L2 Primary Name** (2–3h)

---

## 11) Testing & Acceptance
**Unit**
- Text record parse/stringify; (optional) `walrus://` contenthash round-trip.

**Integration**
- Mock Walrus upload → ENS write → gateway resolves & serves.
- Cache behavior: first request MISS, second HIT.

**Demo Acceptance**
- `walrens link yoursub.yourname.eth ./apps/example-site --id <id> --site` prints tx hash + gateway URL.
- Visiting the gateway URL renders the page.

---

## 12) Risks & Mitigations
- **Walrus API variability:** keep assets small; stream uploads; handle chunk errors; document limits.
- **ENS gas/permissions:** use testnets or funded key; check resolver presence; friendly errors.
- **`contenthash` compatibility:** keep Text record canonical; mark `contenthash` as experimental.

---

## 13) Hand-off Checklist (what’s needed)
- Walrus **read** & **upload** endpoints + auth + sample responses.
- Confirm blob/site **ID format** and site path routing (default index).
- Preferred target **networks** and a **test ENS name/subname** we can modify.
- (Optional) `L2ReverseRegistrar` addresses for Base/OP if pursuing the L2 prize.

---

## 14) Executive Explanation of Goals
**What we’re building:** A developer tool that binds human-readable ENS names to content stored on Walrus, with a trivial DX (one command) and a simple resolution path (HTTP gateway + SDK).

**Why it matters:** ENS is where identity and discovery live in Ethereum; Walrus offers low-cost, durable content addressing. Joining them unlocks ENS-addressed sites, docs, and media without bespoke infra.

**Hackathon fit:** Minimal blast radius (no contracts) and visible demo value. Judges can run one CLI command, watch an ENS record change, and load a live site via the gateway.

**Post-hack potential:** Formalize a `walrus://` `contenthash` codec, ship a Vite/Next plugin, add auto-repack/reseal service, and optionally a browser resolver extension.
