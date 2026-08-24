# Project Instructions & Operating Ledger

Project: Dreamofdreams-site

## General Rules
- Work only inside this repository.
- Inspect the existing codebase before making changes.
- Do not modify unrelated files.
- Never expose passwords, tokens, API keys, or secrets.
- Never store credentials, API keys, or PATs (Personal Access Tokens) within the repository.
- Review git diff before committing.
- Ask before deleting important files.

## Project Memory Maintenance Rules
To ensure seamless transitions between development sessions, `GEMINI.md` serves as the persistent project memory and operating ledger.

### Session Initialization Workflow
Before beginning substantial work in any Gemini CLI session, the agent must:
1. Read `GEMINI.md` to load the current project state, active goals, and roadmap.
2. Inspect the current Git status and workspace files.
3. Synthesize these inputs to establish the project context before modifying any files.

### Post-Task Documentation Workflow
After every meaningful project task, the agent must update `GEMINI.md` before completing the task. The file must remain a concise, accurate representation of the CURRENT project state. Rather than allowing contradictory or redundant history to accumulate, the agent must actively remove or revise outdated information.

For each meaningful task, the agent must record/update:
- **Completed Work:** What was finished and verified.
- **Files Modified/Created:** Important files created or modified.
- **Key Decisions:** Important architectural or implementation decisions.
- **Implementation Status:** Current status of individual components.
- **Roadmap & Tasks:** Update outstanding tasks and implementation sequence when appropriate.
- **Known Issues:** Known issues or limitations.
- **Resume Point:** The exact suspension/resume point so future sessions know exactly where to continue.

### Security Boundaries
- **Strict Credential Protection:** Never write passwords, tokens, API keys, secret values, or other credentials into `GEMINI.md`.
- **Secret Vault Reference Policy:** Secret Manager or other vaults may be referenced by secret **NAME** only, never by their secret value.

## Automatic UI Preview Workflow Rules
To maintain the visual integrity and responsive behavior of the site on Android viewports, a strict preview and inspection loop must be followed for any changes that modify frontend presentation or visible behavior.

### Affected Changes
This workflow applies to any modification of user-visible frontend layout or appearance, including:
- HTML layout and structural markup
- CSS/styles
- Buttons, links, or CTAs
- Site navigation, headers, or footers
- Forms and user input elements
- Images, videos, or other visual assets
- Typography, styling, spacing, or alignment
- Responsive layout or mobile-specific behavior
- Sales/pricing presentations and visible text placement

### Mandatory Workflow Steps
Before completing any task modifying user-visible frontend assets, the agent must perform the following:

1. **Repository Root Execution:** Always operate from the repository root: `~/projects/Dreamofdreams-site`.
2. **Detect Active HTTP Server:** Check if a local HTTP server is already running on port `8080` (reusing it if present).
3. **Start Non-Duplicate Server:** If no server is running on port `8080`, start one from the repository root using:
   `python -m http.server 8080 --bind 127.0.0.1`
   Do not start duplicate preview servers.
4. **Connection Verification:** Programmatically verify that the local HTTP server is fully responding before declaring that the preview is ready.
5. **Android Browser Integration:** Automatically launch the changed page in the Android browser using `termux-open-url`.
   - *Example (Homepage):* `termux-open-url http://127.0.0.1:8080/`
   - *Example (Books page):* `termux-open-url http://127.0.0.1:8080/books.html`
6. **Multi-Page Modification:** If multiple pages are modified, launch the most important page first and list the additional URLs in the response.
7. **Failure Resilience:** If `termux-open-url` is unavailable or fails, report the failure clearly, do not claim successful browser launch, and manually supply the exact local preview URLs for manual inspection.
8. **Inspect & Verify:** Report the following clearly to the user:
   - The precise local preview URLs.
   - The specific pages and files modified.
   - The exact visual modifications or elements to inspect.
   - Specific mobile or responsive behaviors to verify.
9. **Approval Restriction:** Do **NOT** commit, push, or stage any frontend/UI modifications until the user has inspected and approved the local preview, unless explicitly requested to bypass preview approval.
10. **Scope Limitation:**
    - Non-UI or backend-only tasks should not start or launch the preview.
    - Never modify unrelated website assets to support previewing.
    - Never expose credentials, secret values, or keys during launching or previewing.
11. **Post-Approval Finalization:**
    - Once the user approves the preview, run final verification checks.
    - Update `GEMINI.md` with the completed work, status, and resume point.
    - Commit and push only when instructed or explicitly requested.

## Project Purpose & Current Goals
The **Dream of Dreams Website** is the official web platform for the novel *Dream of Dreams* by Lorenzo Strother. The site's purpose is to promote the book, share author insights via blogs, offer contact/press materials, and provide an interactive merchandising platform ("Hysco Merchandise Platform") themed around the book's elements (e.g., the crest, sword, chest of destiny).

### Current Strategic Goals:
1. Maintain the existing static presentation pages of the site.
2. Develop and mature the **Hysco Merchandise Platform**, transitioning it from a frontend-only prototype to a full, serverless-backed platform with print-on-demand fulfillment and automated billing.
3. Optimize the book sales funnel by displaying a clear sales presentation hierarchy and routing prospective readers to active purchase nodes.

---

## Current Website & Repository Architecture
This is a static HTML/JS website, compiled from a WordPress export (utilizing the OceanWP theme and Elementor page builder) combined with hand-crafted static modules.

### Core Structure:
- **Presentation Pages:**
  - `index.html`: Home page (featuring Hero section, introduction, and links).
  - `about.html` / `about/index.html`: About the author, Lorenzo Strother.
  - `books.html` / `books/index.html`: Information about *Dream of Dreams* (including sample chapter PDF download).
  - `blogs.html` / `blogs/index.html`: Article indexing page and individual articles (`/blogs/article-*.html`).
  - `contact.html` / `contact/index.html`: Contact forms and reader outreach.
  - `press-kit.html`: Media resources and information.
  - `privacy-policy.html` & `terms-of-service.html`: Standard compliance pages.
- **Hysco Merchandise Platform:**
  - `merch.html`: The user-facing storefront and mockup preview browser.
  - `css/merch.css`: Styling for the interactive storefront.
  - `js/merch.js`: Client-side logic for browsing designs, simulating design generation, and saving preferences.
  - `data/merch-designs.json`: Mock database containing the static list of approved collections and mock designs.
- **WordPress Static Resources:**
  - Assets are stored under `wp-content/` (themes, uploads, custom css/js) and `wp-includes/`.
  - Static endpoint data is stored in `wp-json/`.

---

## Important Completed Work
1. **WordPress Static Integration:** Successfully exported and cleaned up WordPress static HTML files to serve as a fast, reliable, and responsive frontend platform hosted on a custom domain.
2. **Phase 1 Merchandise Storefront (Frontend Foundation):**
   - Implemented a responsive browser UI in `merch.html`.
   - Setup state handling and design transitions in `js/merch.js`.
   - Populated initial items in `data/merch-designs.json` ("Hysco Crest I" and "Prophecy Ruby").
   - Integrated `localStorage` design persistence (saved designs namespace: `dreamofdreams.merch.savedDesigns`).
   - Created a simulated AI generation queue on the client side to test asynchronous feedback loops (loading state displays *"THE FORGES OF HYSCO ARE AT WORK..."*).
3. **Frontend Sales Presentation Hierarchy:**
   - Designed and built a unified, responsive CSS card component (`.sales-hierarchy-container`) appended to `wp-content/themes/oceanwp/style.css` to represent book purchasing tiers cleanly without any `#0` dead link placeholders.
   - Replaced old "Amazon" and "Barnes & Noble" placeholder buttons on `index.html`, `books.html`, and `books/index.html` with the new hierarchy widget.
   - Connected the "Kindle Pre-order" option to the verified Amazon Kindle ASIN link (`https://www.amazon.com/dp/B0HG9WGDMW`).
   - Mapped the Hero "Buy Now" CTA on `index.html` to smoothly scroll to the `#purchase-options` sales target container.
   - Fully preserved the filename, rel, and tab behavior of the "READ CHAPTER 1 — FREE" PDF CTAs on all pages.

---

## Current Implementation Status
- **General Pages:** Production-ready and fully styled.
- **Sales Funnel:**
  - **Phase 1 (Presentation Hierarchy):** 100% Completed. Clear layout, pricing structures, and external Kindle pre-order link deployed.
  - **Phase 2 (Direct Checkout Checkout, Stripe, Apps Script, Webhooks):** 0% Completed (currently in planning).
- **Hysco Merchandise Platform:**
  - **Phase 1 (Frontend Foundation):** 100% Completed. Ready for local simulation, design testing, and frontend review.
  - **Phase 2 (Cloud Integration & Backend):** 0% Completed (currently in planning).

---

## Important Decisions Made
1. **Serverless Architecture for Backend:** To protect API keys and ensure scalability, all high-privilege operations (Stripe checkout sessions, Printful fulfillment orders, AI generation calls) must remain strictly server-side.
2. **Security & Payment Validation:** No raw or arbitrary prompts will be passed to generative AI from the client-side to prevent prompt injection and resource abuse. In addition, payment verification must be performed via server-to-server secure webhooks prior to forwarding any orders to Printful.
3. **No Direct Secret Exposure:** No API keys, passwords, or tokens are allowed in the repository or front-end assets.

---

## Authentication & Development Environment Setup

### Environment Facts:
- **Project Repository:** `Dreamofdreams-site`
- **Active Branch:** `main`
- **Development Device/Environment:** Android Termux (Linux environment on mobile/tablet)
- **Gemini CLI Configuration:** Authenticated with Google Cloud Vertex AI

### Google Cloud & Secret Manager Configuration:
- **Google Cloud Project:** `meta-triode-498617-f8`
- **Secret Manager Secret:** `github-token` (stores the GitHub Personal Access Token securely in GCP)

### Git / GitHub Workflow & Authentication:
- **Git Credential Helper:** `~/.local/bin/git-credential-gcp-secret`
- **Authentication Flow:**
  `Git -> Credential Helper (git-credential-gcp-secret) -> Google Cloud Secret Manager -> Retrieves GitHub Personal Access Token -> GitHub Authorization`
- **Workflow Rules:**
  - Always work in targeted feature branches or commit directly to `main` for project administrative updates.
  - Review git status and git diff carefully before completing any task.
  - Do **not** automatically stage files using `git add .` or `git add -A`. Stage only the precise files modified.

---

## Current Outstanding Tasks
- [ ] Refine/polish the frontend styling of `/merch.html` to match the core dark/fantasy theme of the main site.
- [ ] Design and implement the serverless backend (Cloud Functions or Python/FastAPI) to handle secure operations.
- [ ] Connect the frontend simulated generator to a real generative AI API (e.g. Imagen via Vertex AI) hosted securely behind the backend.
- [ ] Set up the Printful API client for pulling actual product catalogs, generating mockups, and submitting fulfillment orders.
- [ ] Implement Stripe Checkout integration for direct purchases and webhook validation endpoint.

---

## Planned Implementation Sequence
1. **Task 1: Frontend Styling Polish:** Align `/merch.html` aesthetics and CSS more closely with the OceanWP/Elementor theme styles used on the homepage.
2. **Task 2: Serverless Backend Draft:** Scaffold a simple backend using FastAPI or Google Cloud Functions to handle authentication and proxying.
3. **Task 3: Secret Manager Connection:** Validate that the backend securely accesses API credentials from the Google Cloud Secret Manager.
4. **Task 4: AI Image Generation Pipeline:** Hook up the backend to Vertex AI Imagen or another generator, returning real URLs instead of mock placeholders.
5. **Task 5: Printful & Stripe Endpoints:** Create fulfillment and checkout workflows.

---

## Known Issues or Limitations
- **Mock Placeholders:** Currently, adding a new design generates a client-side placeholder image (`via.placeholder.com`) and does not produce real printable artwork.
- **WordPress Hardcoding:** Some asset links inside the theme files (`wp-content/...`) and layout exports reference absolute or older domains (e.g. `lorenzostrother.cloudtrek360.com`). These are dynamically remapped or maintained as-is, but are a known legacy artifact of the WP static export.

---

## Work Suspension Ledger
- **Point of Suspension:** Finished implementing the frontend sales presentation hierarchy across `index.html`, `books.html`, and `books/index.html`, removing dummy `#0` links in these sections, adding styling, and preserving free chapter downloads.
- **Next Step:** Proceed with merchandise frontend styling alignment (`/merch.html`) or commence backend preparation for Phase 2 sales checkout flows.
