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

## Project Purpose & Current Goals
The **Dream of Dreams Website** is the official web platform for the novel *Dream of Dreams* by Lorenzo Strother. The site's purpose is to promote the book, share author insights via blogs, offer contact/press materials, and provide an interactive merchandising platform ("Hysco Merchandise Platform") themed around the book's elements (e.g., the crest, sword, chest of destiny).

### Current Strategic Goals:
1. Maintain the existing static presentation pages of the site.
2. Develop and mature the **Hysco Merchandise Platform**, transitioning it from a frontend-only prototype to a full, serverless-backed platform with print-on-demand fulfillment and automated billing.

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

---

## Current Implementation Status
- **General Pages:** Production-ready and fully styled.
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
- **Point of Suspension:** Finished setting up the operating ledger and recording the complete development environment facts. The repository and credential flows are fully documented.
- **Next Step:** Proceed with the planned implementation sequence (beginning with frontend CSS layout alignment for `/merch.html` or scaffolding backend functions).
