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
   4. **Buy Book Navigation Link Correction:** Completed a comprehensive batch update of the 'Buy Book' list-item menu link and its mobile duplicate across all 18 HTML files in the workspace (36 instances in total) to point cleanly to the `#purchase-options` sales target with proper directory-depth relative paths.
   5. **Authentic Wordmark Replacement & Mobile Navigation Fix:**
      - Changed the homepage hero title to reference the cropped, authentic golden wordmark at `images/dream-of-dreams-wordmark.png` for a clean, zero-padding responsive display over the hero cover book video.
      - Enhanced the wordmark sizing and vertical positioning in `wp-content/themes/oceanwp/style.css`. Substantially increased the displayed dimensions on mobile (spanning 90-95% screen width with `width: 100%` and `max-width: 100%`) and desktop (up to `max-width: 520px`). Shifted the title moderately upward on desktop (`margin-top: -55px`) and substantially upward on mobile (`margin-top: -95px`, shifting it an additional 65px upward) to eliminate excessive vertical whitespace while maintaining elegant spacing and balanced flow into the book-cover below.
      - Diagnosed and fixed the mobile navigation "BUY BOOK" Same-Page Anchor Click issue in `/wp-content/themes/oceanwp/assets/js/theme.min.js?ver=4.1.0`. Intercepted current same-page anchor click events and applied smooth scroll animation programmatically while delaying the menu collapse by 150ms. This prevents the browser from aborting anchor scrolling when the parent menu instantly receives `display: none`.
      - Reduced the displayed size of the upper-left transparent Publishing LLC logo globally by 15% (to `114px` on desktop, `95px` on mobile) and on the home page by 20% (to `215px` on desktop, `120px` on mobile) inside `wp-content/themes/oceanwp/style.css` to prevent visual competition with the main wordmark title.
      - Repositioned the mobile/tablet hamburger dropdown in `wp-content/themes/oceanwp/style.css`. Set absolute positioning with `right: 0`, `left: auto`, and `width: 250px` on `.elementor-nav-menu--dropdown` relative to `.mobile-toggle` to anchor it elegantly beneath the upper-right hamburger toggle button, preventing it from appearing in the center of the page and covering the wordmark title.
      - Fixed text contrast of inactive mobile dropdown menu links in `wp-content/themes/oceanwp/style.css`. Set inactive links to a highly readable warm ivory (`#fdfbf7` with `0.85` opacity), while preserving the active HOME page item (gold background, white text) and hover states exactly as they are.

   ---

   ## Current Implementation Status
- **General Pages:** Production-ready and fully styled.
- **Sales Funnel:**
  - **Phase 1 (Presentation Hierarchy):** Implemented locally — pending visual review and approval.
  - **Phase 2 (PayPal Business checkout, Apps Script verification, email delivery):** 0% Completed (currently in planning).
- **Hysco Merchandise Platform:**
  - **Phase 1 (Frontend Foundation):** 100% Completed. Ready for local simulation, design testing, and frontend review.
  - **Phase 2 (Cloud Integration & Backend):** 0% Completed (currently in planning).

---

## Important Decisions Made
1. **PayPal Business & Apps Script Checkout Architecture:** Direct purchases of the Author's Early Access edition ($29.99) will be powered by PayPal Business as the default payment processor. Secure payment verification and automated digital fulfillment will be driven by a Google Workspace / Apps Script / Drive / Gmail serverless pipeline.
2. **Serverless Architecture for Merchandise Backend:** To protect API keys and ensure scalability, high-privilege operations on the Merchandise Platform (Stripe checkout, Printful catalog, AI generator) will remain strictly server-side.
3. **Security & Payment Validation:** No raw or arbitrary prompts will be passed to generative AI from the client-side to prevent prompt injection and resource abuse. In addition, payment verification must be performed via server-to-server secure webhooks prior to forwarding any orders to Printful.
4. **No Direct Secret Exposure:** No API keys, passwords, or tokens are allowed in the repository or front-end assets.

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
1. **Task 1: Visual Inspection & Approval:** Conduct local HTTP preview and inspection of the sales presentation hierarchy.
2. **Task 2: Final Frontend Verification:** Run clean-up, final link audits, and responsive alignment checks.
3. **Task 3: Commit & Push Approved Frontend:** Stage and push the approved sales-funnel UI changes to `origin main`.
4. **Task 4: PayPal Business Integration:** Embed PayPal checkout buttons for the $29.99 Author's Early Access edition.
5. **Task 5: Apps Script Automation:** Build the webhook listener and automated email pipeline to deliver the digital copy of the book upon successful payment.
6. **Task 6: Update Privacy Policy & Terms:** Rewrite policy pages to precisely document the direct sale and fulfillment handling.

---

## Known Issues or Limitations
- **Release Date Discrepancy (OPEN):** `press-kit.html` (Line 44) lists a static release date of `"August 2026"`, while the newly designed Paperback and Hardcover presentation entries advertise a release date of `"February 26, 2027"`. This remains an open issue requiring user confirmation before modifying `press-kit.html`.
- **Mock Placeholders:** Currently, adding a new design generates a client-side placeholder image (`via.placeholder.com`) and does not produce real printable artwork.
- **WordPress Hardcoding:** Some asset links inside the theme files (`wp-content/...`) and layout exports reference absolute or older domains (e.g. `lorenzostrother.cloudtrek360.com`). These are dynamically remapped or maintained as-is, but are a known legacy artifact of the WP static export.

---

## Work Suspension Ledger
- **Point of Suspension:** Completed robust visual and navigation refinements on the Dream of Dreams website.
- **Hamburger Menu Diagnosis & Correction:**
  - *Status:* The previous vanilla-JS fallback was implemented but failed real-device visual testing because the mobile navigation menu remained completely collapsed at height 0.
  - *Root Cause:* The static WP export lacks live backend configuration and REST variables, crashing Elementor Pro's menu script bundle during load. The compiled CSS hides the dropdown menu using `max-height: var(--menu-height)`. Since Elementor's JS is crashed, `--menu-height` is never set or calculated at runtime, keeping the menu collapsed.
  - *Final Fix:* Implemented direct style-forcing on the dropdown menu in the vanilla-JS listener fallback (inside `/wp-content/themes/oceanwp/assets/js/theme.min.js?ver=4.1.0`) by applying `max-height`, `transform`, `opacity`, `visibility`, and `display` values natively with `!important` priority on active click. Added active menu overrides in `/wp-content/themes/oceanwp/style.css` as a secure backup. Tested on mock DOM, verified 100% working state transitions.
- **Title Treatment Refinement & Bounding Box Crop:**
  - *Issue:* The text-based "DREAM OF DREAMS / THE PROPHECY BEGINS" title treatment was placed in the author section (lower on the page) and was not visible at the top, and did not match the authentic branding.
  - *Correction:* Removed the text title and subtitle entirely, and cleaned up obsolete CSS (`.book-main-title` and `.book-subtitle`). Programmatically cropped `logo_transparent.png` vertically (rows 420-968) and horizontally (columns 236-1337) to isolate the authentic golden wordmark lettering cleanly at `1101 x 548` resolution with zero transparent padding. Added this new `dream-of-dreams-wordmark.png` asset directly above the video cover inside the hero section, styled with clean responsive CSS rules.
- **BUY BOOK Navigation Link Correction:**
  - *Fix:* Executed a comprehensive batch update of the "Buy Book" list-item menu links (both desktop and mobile duplicates) across all 18 HTML files (36 instances in total) in the codebase. Corrected the `href` values so they point cleanly to the `#purchase-options` sales target container using proper relative paths adapted to the directory depth of each file (e.g. `#purchase-options` on the homepage, `index.html#purchase-options` for top-level pages, `../index.html#purchase-options` for 1-depth nested pages, and `../../index.html#purchase-options` for 2-depth nested pages).
- **Next Step:** Obtain final visual and interactive approval on mobile/tablet from the user on the local HTTP preview server before staging, committing, or pushing.

