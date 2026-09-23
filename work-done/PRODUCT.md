# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

1. **Product Managers & UX Leads**: Professionals mapping out application journeys, onboarding funnels, and checkout flows to communicate requirements clearly to engineering teams and executive stakeholders.
2. **Product & UI/UX Designers**: Designers showcasing multi-screen flows, state transitions, interaction hotspots, and device frame presentations without needing heavy video rendering or complex Figma prototypes.
3. **Frontend Engineers & QA Specialists**: Developers and testers who require unambiguous documentation of what the user is doing, what is visible on screen, what happens next, and the exact transition timing and easing curves.
4. **Product Marketing & Customer Success Teams**: Customer-facing operators who create interactive product walkthroughs, onboarding tutorials, and shareable release changelogs for clients.

## Product Purpose

StoryFlow Studio transforms static app and web screenshots into dynamic, interactive walkthroughs, animated user flows, and comprehensive specifications. It bridges the communication divide between product design, engineering, and stakeholders by providing an integrated pipeline: capturing screenshots, annotating interface elements with numbered callouts and analytical context, sequencing steps with micro-interactions and transitions, experiencing interactive playback with voice narration, and exporting developer-ready documentation and zero-dependency standalone artifacts.

Success means:
- Stakeholders and engineers can experience and understand complete user journeys in seconds with zero guesswork.
- A user can build an annotated, animated flow from raw screenshots in under 5 minutes without backend infrastructure.
- Interactive flows can be shared seamlessly through compressed, self-contained URL payloads, offline standalone HTML files, or markdown technical specs.

## Positioning

Unlike static screenshot tools (Lightshot, CleanShot) that only capture isolated moments, and unlike heavyweight design tools (Figma) that require complex vector prototyping rigs, StoryFlow Studio is a specialized **walkthrough engineering workbench**. It pairs visual screen sequencing with structured analytical triple-layer notes (*"What the user is doing"*, *"What is visible on screen"*, *"What happens next"*), hardware-accurate frame simulation, native Web Speech audio narration, and instant serverless sharing via compressed URL hash payloads.

## Operating Context

- **Workflow environments**: Web-based desktop workspace (optimized for 1280px+ displays with responsive tablet/mobile fallbacks).
- **Core rituals**:
  - Feature kickoffs & sprint planning walkthroughs.
  - Design-to-engineering handoff sessions.
  - Bug reporting and edge-case reproduction sequences.
  - Customer product tours and release changelog demos.
- **Documents & materials**: PNG/JPEG/SVG screenshots, design mockups, mobile screenshots (iOS/Android), desktop browser captures, markdown specifications, JSON project bundles.

## Capabilities and Constraints

### Confirmed Functionality
- **Multi-project management**: Create, switch, and maintain independent project workspaces stored client-side.
- **Hierarchical app/platform categorization**: Flexible folder tree grouping screenshots by application name and operating system target (e.g., `Orbit Pay / iOS`, `FintechPay / iOS`, `Desktop / Web`).
- **Screenshot asset ingest**: File upload, drag-and-drop zone, and global window clipboard paste (`Ctrl+V`/`Cmd+V`) with automated aspect-ratio detection and default frame assignment (`iphone` vs. `desktop`).
- **Deep annotation canvas**: Normalized percentage-based coordinate system (0–100%) supporting 6 annotation types (`highlight`, `rectangle`, `arrow`, `callout-pin`, `text-box`, `spotlight`), customizable stroke colors, stroke widths, and numbered badges.
- **Structured step analysis**: Enforced 3-phase behavioral documentation fields on every snapshot and story step (`userAction`, `screenContent`, `nextAction`).
- **Flow sequencing & motion choreography**: Step reordering, duplicate step, step transition configuration (`fade`, `slide-left`, `slide-right`, `slide-up`, `slide-down`, `scroll-down`, `scroll-up`, `tap-zoom`, `modal-pop`), duration, and easing (`linear`, `ease`, `ease-in-out`, `spring`).
- **Interactive hotspots**: Configurable interaction indicators (`tap`, `cursor-click`, `swipe-up`, `swipe-left`, `swipe-right`, `highlight-box`) with animated ping pulses that advance steps on user click.
- **Interactive playback player**: Hardware-accelerated viewport with iPhone, Android, and Desktop device frames, fullscreen mode, playback speed adjustment (0.5x to 2.0x), step progress scrubber, and narrative side-drawer.
- **Audio voice narration**: Built-in browser speech synthesis (`SpeechSynthesisUtterance`) with voice selection prioritizing Google US English and natural voices, adjustable rate/pitch/volume, speech section toggles, and optional auto-advance on speech completion.
- **Zero-backend sharing & export**:
  - URL sharing via LZ-String encoded URI fragments (`#player=` for project-wide multi-flow player, `#flow=` for single walkthrough).
  - Standalone single-file interactive HTML presentation bundle with self-contained CSS/JS player.
  - Complete Markdown technical specification export with copy-to-clipboard and `.md` file download.
  - Full JSON project backup export and validation-checked JSON restore.
  - Browser print stylesheet formatting for PDF generation.

### Technical Constraints
- Entirely client-side SPA execution (React 19 + Vite 8).
- Data persisted to browser `localStorage` (`storyflow_projects_v1`, `storyflow_active_project_id_v1`, `storyflow_audio_settings_v1`). Large binary screenshot payloads are stored as base64 data URLs or SVG URIs, constrained by browser storage quotas (~5MB–10MB in typical local storage).
- No remote database, no server-side user authentication, and no cloud synchronization in the current implementation.

## Brand Commitments

- **Name**: StoryFlow Studio (abbreviated "SF" in product badge).
- **Tone & Voice**: Focused, precision-engineered, modern, dark-mode first, distraction-free. Avoids playful fluff in favor of clarity and technical rigor.
- **Visual Personality**: High-density SaaS workspace aesthetic featuring slate/midnight surfaces (`#020617`, `#0f172a`), crisp indigo/blue primary accents (`#3b82f6`, `#6366f1`), precise micro-borders (`#1e293b`), and clear monospaced indicators (`JetBrains Mono`).

## Evidence on Hand

- **Existing Codebase**: Complete React TypeScript application implementing `TopBar`, `FolderSidebar`, `ScreenshotGallery`, `AnnotationStudio`, `StoryBuilder`, `PlaybackPlayer`, `ExportView`, and `AudioSettingsModal`.
- **Preloaded Seed Data**: Two fully configured demonstration projects (`Orbit Pay` mobile fintech app with 4 iOS screens, 4 snapshots, and animated transfer flow; `Aura AI Suite` web SaaS platform with 4 desktop screens and model generation flow).
- **Vector Graphics Assets**: High-fidelity vector SVG mock screens (`MOCK_SCREENS`) generating zero-network vector screens for offline reliability.

## Product Principles

1. **Zero-Friction Ingest**: Getting screenshots into the app must require zero setup—paste from clipboard, drop files, or load seed examples instantly.
2. **Behavior Over Static Pixels**: A screenshot alone is just a static picture. Value is created when screens are connected by user intent, visible state, and next actions.
3. **Self-Contained Portability**: Every flow, export, and shared link must function independently without requiring external hosting, backend databases, or third-party accounts.
4. **Developer-Ready Precision**: Transitions, timings, easing curves, coordinates, and interactions must be quantifiable and exportable in standard units (seconds, percentages, pixels).
5. **Speed of Playback**: An interactive preview must be immediate. Switching flows, toggling audio, or jumping steps should feel instantaneous and responsive.

## Accessibility & Inclusion

- Keyboard shortcuts and visible step scrubber buttons for accessible step-by-step navigation.
- Web Speech API integration provides auditory narration of visual steps for visually impaired collaborators or multimodal review.
- High-contrast text pairings (slate-100 on slate-950/slate-900 background) exceeding WCAG AA standards.
- Focus outlines and descriptive ARIA labels across modal buttons, scrubber pips, and navigation controls.
