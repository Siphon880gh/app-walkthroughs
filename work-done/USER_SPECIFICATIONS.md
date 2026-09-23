# User Specifications & UX Design Brief: StoryFlow Studio

## Available Evidence & Research Baseline

### Directly Observed Evidence (from Codebase Inspection)
- **Application Views**: 5 primary views (`screenshots`, `editor`, `stories`, `player`, `export`) accessible via persistent top navigation tabs.
- **Data Persistence**: Client-side storage via browser `localStorage` under `storyflow_projects_v1` and `storyflow_active_project_id_v1`. No remote server or user authentication mechanism exists in the codebase.
- **Asset Ingest**: Multi-format image ingestion via HTML file input, drag-and-drop boundary, and global `window.paste` event listener converting files to base64 Data URLs.
- **Organization Hierarchy**: Two-tier folder categorization (`app / platform`, e.g., `Orbit Pay / iOS`, `FintechPay / iOS`, `Desktop / Web`).
- **Annotation Tools**: 6 vector annotation primitives (`highlight`, `rectangle`, `arrow`, `callout-pin`, `text-box`, `spotlight`) mapped to normalized 0–100% canvas coordinates.
- **Narrative Triad Structure**: Persistent three-phase analytical step inputs:
  1. *What the user is doing* (`userAction`)
  2. *What is visible on screen* (`screenContent`)
  3. *What should happen next* (`nextAction`)
- **Animation & Transitions**: Configurable step motion (`fade`, `slide-left`, `slide-right`, `slide-up`, `slide-down`, `scroll-down`, `scroll-up`, `tap-zoom`, `modal-pop`) with duration, easing curves, and scroll offsets.
- **Interactive Player**: Hardware simulation frames (iPhone with Dynamic Island, Android with punch-hole camera, Desktop browser window with traffic-light dots, or borderless canvas), interactive hotspots that advance on click, timeline scrubber, and speed controls (0.5x to 2x).
- **Multimodal Audio Narration**: Browser Web Speech API (`SpeechSynthesis`) with configurable voices (Google US English prioritized), speech rate, pitch, volume, and toggleable narrative fields.
- **Export & Distribution**: LZ-String compressed URL hash links (`#player=` for multi-flow project, `#flow=` for single walkthrough), single-file standalone offline HTML presentation download, Markdown technical specification export, and JSON backup/restore.

### Inferences vs. Unknowns
- **Inferred Need**: Users require fast, zero-dependency tools because corporate security firewalls often block cloud uploads or SaaS design tooling subscriptions.
- **Unknowns**: Enterprise user authorization policies, multi-user real-time concurrent editing needs, cloud collaboration storage preferences, and longitudinal usage analytics. These are absent in the local codebase.

---

## 1. User Needs

| Need | Category | Evidence | Confidence | Product/UI Implication |
| :--- | :--- | :--- | :--- | :--- |
| **Rapid, frictionless screenshot ingest** | Functional / use-based | `ScreenshotGallery.tsx` handles drag-drop, file selector, and global window `paste` (`Ctrl+V`) directly into folder trees. | **High** | Users do not want to upload files one-by-one; paste and batch drops must immediately route into the active app/platform folder. |
| **Precise visual element callouts** | Functional / use-based | `AnnotationStudio.tsx` provides 6 vector shapes, color swatches, stroke widths, and numbered badges with normalized coordinates. | **High** | UI must offer instant drawing feedback, visual selection handles, and non-destructive deletion/re-coloration. |
| **Structured behavioral documentation (Triad)** | Functional / use-based | `Snapshot` and `StoryStep` interfaces enforce `userAction`, `screenContent`, and `nextAction` fields across editor, player, and markdown. | **High** | Forms must present dedicated, clearly labeled text fields for user action, screen state, and expected next action rather than a single generic notes field. |
| **Realistic hardware mockup simulation** | Usability / constraint | `PlaybackPlayer.tsx` and `StoryBuilder.tsx` implement SVG/CSS bezels for iPhone, Android, and Desktop frames. | **High** | Screenshots must retain their native aspect ratio and sit inside accurate device borders rather than stretching. |
| **Zero-dependency, instantaneous sharing** | Usability / constraint | `shareUtils.ts` compresses complete flows into URL hash fragments (`#player=` and `#flow=`) via `lz-string` with no backend database. | **High** | UI must provide 1-click URL copy buttons with visual "Copied!" feedback and handle incoming share hash on load. |
| **Auditory / hands-free multimodal walkthrough** | Usability / constraint | `speechUtils.ts` and `AudioSettingsModal.tsx` wrap the browser SpeechSynthesis API to vocalize narrative step notes. | **High** | Player needs play/pause speech controls, voice picker with Google US English prioritization, and auto-advance on speech end. |
| **Professional credibility during stakeholder reviews** | Emotional / meaning-based | Dark-mode interface aesthetic, realistic transition animations (slide, scroll, zoom), and standalone HTML presentation export. | **Medium** | Artifacts generated by the tool must look polished, eliminating low-fidelity prototype jank. |
| **Privacy & confidentiality of unreleased screens** | Social / trust need | Local client-side execution using browser `localStorage` with zero remote telemetry or external server transmission. | **High** | Users working under strict NDAs can safely process pre-launch screenshots without fear of data leakage to external clouds. |

---

## 2. User Personas

### Persona 1: Elena Rostova — Lead Product Manager
- **Role & Context**: Lead PM managing consumer fintech applications at a fast-moving scaleup. Elena writes PRDs and presents feature walkthroughs during sprint kickoffs and executive reviews.
- **Goals**: Communicate multi-screen user flows (e.g., P2P money transfers, biometric authentication) with crystal-clear behavioral specifications so engineering builds the right thing on the first attempt.
- **Jobs to be Done**:
  - Sequence mobile screenshots into a logical narrative step-by-step.
  - Document user intent and edge-case reactions for each screen.
  - Export technical markdown documentation directly into Jira/Notion tickets.
- **Likely Motivations**: Eliminate ambiguity in engineering tickets; reduce back-and-forth Slack debates during sprint execution.
- **Frustrations & Barriers**: Static PDF slide decks feel dead and fail to explain transition animations; Figma prototype links are heavy, slow to load, and allow non-technical stakeholders to get lost clicking random hotkeys.
- **Technical Confidence & Constraints**: High web proficiency; uses Mac and iOS; constrained by time and corporate confidentiality guidelines.
- **Account & Permissions**: Local client user; no login required.
- **Features Used**: Screenshot upload, Story Builder step sequencer, Narrative Triad editor (`userAction`, `screenContent`, `nextAction`), Markdown Export.
- **What Success Means**: Elena produces a complete, annotated, animated walkthrough in under 10 minutes that engineers can review in Jira without asking clarifying questions.
- **Evidence & Confidence**: **High**. Represented directly in seed data (`Orbit Pay / iOS`, `Elena Rostova`, transfer walkthrough).

### Persona 2: Marcus Vance — Senior Product Designer
- **Role & Context**: Product & Interaction Designer working across design systems and mobile app journeys.
- **Goals**: Demonstrate micro-interactions (e.g., swipe to confirm, tap zooming, scroll distance) and realistic device framing to clients without coding a custom React prototype.
- **Jobs to be Done**:
  - Highlight specific buttons, input cards, and biometric sheets with numbered visual pins.
  - Set accurate motion transitions (`slide-left`, `spring` easing, `modal-pop`).
  - Share an interactive player link that clients can click through on their phones.
- **Likely Motivations**: Deliver immersive client presentations that win executive sign-off on design system proposals.
- **Frustrations & Barriers**: Screen recordings (MP4) cannot be clicked or paused interactively; video files are too large to email.
- **Technical Confidence & Constraints**: Expert in visual design and motion principles; comfortable with transition timings (milliseconds) and easing bezier curves.
- **Account & Permissions**: Local client user.
- **Features Used**: Annotation Studio (vector pins, highlights, rectangles), Story Builder (transition duration/easing, interaction hotspots), Interactive Playback Player.
- **What Success Means**: A client opens a shared `#player=` URL in their mobile Safari browser and taps through the interactive prototype with native-feeling transitions.
- **Evidence & Confidence**: **High**. Supported by transition types (`scroll-down`, `modal-pop`, `spring`), interaction hotspots, and share URL compression.

### Persona 3: David Chen — Frontend Lead & Implementation Engineer
- **Role & Context**: Senior Frontend Engineer implementing React and React Native interfaces based on design handoffs.
- **Goals**: Understand the exact state transitions, visual coordinates, and behavioral expectations before writing component code.
- **Jobs to be Done**:
  - Inspect what triggers each navigation event.
  - Extract transition curves (`0.6s ease-in-out`) and scroll distance parameters (`300px`).
  - Download JSON or Markdown specs to verify implementation against acceptance criteria.
- **Likely Motivations**: Avoid post-sprint redesigns caused by mismatched interaction expectations.
- **Frustrations & Barriers**: Vague PRDs stating "user sends money" without specifying what appears on screen or what happens when the API call is in flight.
- **Technical Confidence & Constraints**: Expert developer; highly attentive to precision, coordinates, and timings.
- **Account & Permissions**: Local client user.
- **Features Used**: Export View (Markdown specs, JSON bundle, step preview table), Playback Player (scrubber timeline, step-by-step frame inspection).
- **What Success Means**: David opens the Markdown spec or Playback Player and receives exact technical parameters (coordinates, transitions, and step triggers) without scheduling a sync meeting.
- **Evidence & Confidence**: **High**. Directly supported by markdown documentation generator and precision properties in `StoryStep`.

### Persona 4: Maya Patel — Customer Success & Onboarding Specialist *(Provisional)*
- **Role & Context**: Customer Success Manager onboarding enterprise clients onto a complex SaaS platform.
- **Goals**: Create automated product tour guides and walkthroughs for non-technical client teams.
- **Jobs to be Done**:
  - Run an interactive walkthrough with synthesized speech narration explaining features.
  - Export a standalone single-file HTML presentation that clients can open offline without creating an account.
- **Likely Motivations**: Scale user enablement and decrease time-to-value for new enterprise accounts.
- **Frustrations & Barriers**: Hosting video files requires corporate IT approvals; screen share calls are repetitive and unscalable.
- **Technical Confidence & Constraints**: Non-technical; relies on simple browser tools and self-contained HTML files.
- **Account & Permissions**: Local client user.
- **Features Used**: Playback Player with Audio Narration (Web Speech API), Export View (Standalone HTML Presentation download).
- **What Success Means**: Maya sends a single `.html` file to a client that plays a narrated tour of their custom portal with zero installation friction.
- **Evidence & Confidence**: **Medium (Inferred from features)**. The presence of Web Speech API narration, voice customization, and self-contained HTML bundle generation provides direct architectural support for this persona.

---

## 3. User Goals

### Goal 1: Zero-Friction Flow Construction
- **Outcome**: The user transforms a collection of loose app screenshots into a sequenced, multi-step flow in under 5 minutes.
- **Connected Needs**: Rapid screenshot ingest, hierarchical folder categorization, step reordering.
- **Supporting Features & Workflows**: Window paste handler (`paste`), drag-and-drop gallery, "Add to Story" button, step thumbnail drag reordering.
- **Evidence & Confidence**: **High**. Implemented in `ScreenshotGallery.tsx` and `StoryBuilder.tsx`.

### Goal 2: Clear Behavioral Specification (The Triad)
- **Outcome**: The user produces unambiguous documentation for every step covering user action, visible elements, and next actions.
- **Connected Needs**: Structured behavioral documentation, precision element callouts.
- **Supporting Features & Workflows**: `AnnotationStudio.tsx` metadata form, `StoryStep` schema, markdown export generator.
- **Evidence & Confidence**: **High**. Supported by canonical fields across all entities.

### Goal 3: High-Fidelity Interactive Demonstration
- **Outcome**: The user presents a realistic, animated simulation of the app running inside accurate mobile or desktop frames.
- **Connected Needs**: Realistic hardware mockup simulation, auditory multimodal walkthrough, professional credibility.
- **Supporting Features & Workflows**: `PlaybackPlayer.tsx` hardware frames, CSS/SVG transition engine, hotspot click handling, Web Speech audio narration.
- **Evidence & Confidence**: **High**. Implemented in `PlaybackPlayer.tsx` and `AudioSettingsModal.tsx`.

### Goal 4: Instant, Frictionless Distribution
- **Outcome**: Collaborators receive and interact with the walkthrough instantly without installing software, creating accounts, or accessing internal servers.
- **Connected Needs**: Zero-dependency sharing, confidentiality, portability.
- **Supporting Features & Workflows**: LZ-String URL hash compression (`#player=...` and `#flow=...`), standalone HTML presentation export, project JSON backup/restore.
- **Evidence & Confidence**: **High**. Implemented in `shareUtils.ts` and `ExportView.tsx`.

---

## 4. User Stories & Workflow Requirements

### Story 1: Rapid Ingestion of Screenshots via Clipboard Paste
> **"As a Product Designer, I want to paste screenshots directly from my system clipboard into StoryFlow Studio, so that I can assemble walkthrough screens without manually saving and finding files on my hard drive."**

- **Related Persona & Goal**: Marcus Vance (Designer); Goal 1 (Zero-Friction Ingest).
- **Relevant Feature**: `ScreenshotGallery.tsx` (`handlePaste` event listener on `window`).
- **Required Data / Inputs**:
  - Image file in clipboard buffer (`clipboardData.files`).
  - Target folder path (derived from `selectedFolder` or defaults to `${project.name} / Web`).
- **Prerequisites**: User must have copied an image to their clipboard and have the StoryFlow window active.
- **Effect of Missing Inputs**: If non-image content is pasted (e.g., plain text), the handler silently ignores it without error.
- **Observable Success Criteria**: New screenshot cards immediately appear in the gallery grid with tags derived from the active folder, and the first new screenshot is set as active.
- **Current Support Status**: **Fully Supported**. Verified in `ScreenshotGallery.tsx` (lines 59–77).

---

### Story 2: Visual Annotation with Numbered Callouts & Analytical Triad
> **"As a Product Manager, I want to draw numbered callout pins and rectangular highlights over a screenshot while specifying the user's action and visible elements, so that engineers understand exactly which UI element is being discussed."**

- **Related Persona & Goal**: Elena Rostova (PM); Goal 2 (Clear Behavioral Specification).
- **Relevant Feature**: `AnnotationStudio.tsx`.
- **Required Data / Inputs**:
  - Active screenshot ID and Data URL.
  - Selected tool (`callout-pin`, `highlight`, `rectangle`, `arrow`, `text-box`, `spotlight`).
  - Canvas drag coordinates (normalized to 0–100%).
  - Text fields: `snapshotName`, `userAction`, `screenContent`, `nextAction`.
- **Prerequisites**: At least one screenshot must exist in the project.
- **Effect of Missing Inputs**: If text fields are blank, default placeholder strings are assigned upon adding to a story.
- **Observable Success Criteria**: An SVG/HTML annotation overlay renders over the screenshot canvas. Clicking "Save Snapshot" persists the metadata and displays a confirmation notification. Clicking "Add to Story" creates a new step in the active story.
- **Current Support Status**: **Fully Supported**. Implemented in `AnnotationStudio.tsx`.

---

### Story 3: Motion Choreography & Interactive Hotspots
> **"As a Product Designer, I want to configure transition animations (such as sliding left with spring easing) and place clickable hotspot indicators on specific buttons, so that stakeholders experience the authentic feel of the mobile interaction."**

- **Related Persona & Goal**: Marcus Vance (Designer); Goal 3 (High-Fidelity Demonstration).
- **Relevant Feature**: `StoryBuilder.tsx` (Step Inspector) and `PlaybackPlayer.tsx`.
- **Required Data / Inputs**:
  - Step transition type (`slide-left`, `modal-pop`, etc.), duration in seconds, easing curve.
  - Interaction indicator: type (`tap`, `cursor-click`, `swipe-up`), coordinates (`xPercent`, `yPercent`), and label.
- **Prerequisites**: A story must contain at least one step.
- **Effect of Missing Inputs**: Default transition (`slide-left`, 0.6s, `ease-in-out`) and centered tap hotspot are automatically populated.
- **Observable Success Criteria**: In the Playback Player, an animated pulsing hotspot ring appears at the specified coordinates. Clicking the hotspot triggers a ripple animation and advances to the next step immediately.
- **Current Support Status**: **Fully Supported**. Implemented in `StoryBuilder.tsx` and `PlaybackPlayer.tsx`.

---

### Story 4: Multimodal Audio Playback & Voice Narration
> **"As a Customer Success Lead, I want the player to read aloud the step title, user actions, and visible screen contents using a natural voice, so that viewers can listen to a guided tour without reading dense paragraphs of text."**

- **Related Persona & Goal**: Maya Patel (CS); Goal 3 (High-Fidelity Demonstration).
- **Relevant Feature**: `PlaybackPlayer.tsx` and `AudioSettingsModal.tsx`.
- **Required Data / Inputs**:
  - Audio settings toggle (`enabled: true`).
  - Selected voice URI (auto-resolves to Google US English if available).
  - Rate (0.5x–2.0x), pitch, volume.
  - Granular toggles (`readTitle`, `readUserAction`, `readScreenContent`, `readNextAction`, `advanceOnSpeechEnd`).
- **Prerequisites**: Browser must support the Web Speech API (`'speechSynthesis' in window`).
- **Effect of Missing Inputs**: If browser speech is unsupported or muted, player falls back gracefully to visual-only playback without error.
- **Observable Success Criteria**: Upon advancing to a step, speech synthesis synthesizes and vocalizes the combined narrative text. If `advanceOnSpeechEnd` is enabled, the player automatically steps forward once narration finishes.
- **Current Support Status**: **Fully Supported**. Implemented in `speechUtils.ts`.

---

### Story 5: Serverless Walkthrough Sharing via Compressed URL Fragment
> **"As a Lead PM, I want to generate a 1-click shareable web link containing the entire interactive walkthrough encoded directly in the URL hash, so that external stakeholders can play the prototype instantly without logging into an account or needing cloud database access."**

- **Related Persona & Goal**: Elena Rostova (PM) / David Chen (Engineer); Goal 4 (Instant Distribution).
- **Relevant Feature**: `shareUtils.ts`, `ExportView.tsx`, and `App.tsx` (mount URL hash parser).
- **Required Data / Inputs**:
  - Active project, stories, and required screenshot image assets.
  - Scope selection: Entire Project Player (`#player=`) or Single Flow (`#flow=`).
- **Prerequisites**: Walkthrough must contain at least one step and valid screenshot data.
- **Effect of Missing Inputs**: If URL length exceeds browser address limits (>2MB), compression might fail or be truncated; for large projects, users are prompted to download the standalone HTML bundle instead.
- **Observable Success Criteria**: Clicking "Copy Share Link" copies a compressed URL to the clipboard and displays "Copied!" for 2.5 seconds. Opening the URL on any browser immediately unpacks the payload and launches the Playback Player.
- **Current Support Status**: **Fully Supported**. Implemented in `shareUtils.ts` and `App.tsx`.

---

### Story 6: Standalone Offline HTML Presentation & Markdown Specs Export
> **"As an Implementation Engineer, I want to download a self-contained single-file HTML presentation and a clean Markdown document of the entire flow, so that I can embed the specs in our internal wiki and review the walkthrough offline."**

- **Related Persona & Goal**: David Chen (Engineer); Goal 4 (Instant Distribution).
- **Relevant Feature**: `ExportView.tsx`.
- **Required Data / Inputs**:
  - Active story steps, associated screenshot assets, and analytical notes.
- **Prerequisites**: Project must contain at least one story with steps.
- **Observable Success Criteria**: Clicking "Download HTML File" initiates a browser download of a `.html` file with embedded styles, scripts, and base64 images that runs offline without an internet connection. Clicking "Download Markdown" downloads a formatted `.md` file with tabular details.
- **Current Support Status**: **Fully Supported**. Implemented in `ExportView.tsx`.

---

## 5. Information Hierarchy & Interaction Principles

1. **Persistent Top Bar Navigation**:
   - Primary view switcher (`Screenshots`, `Annotation Studio`, `Story Builder`, `Playback Player`, `Export & Share`) remains visible across all screens, allowing instantaneous context switching without modal traps.
2. **Contextual Inspector Pattern**:
   - Both the Annotation Studio and Story Builder split the viewport into a prominent visual staging canvas (center) and a dedicated metadata property inspector (right).
3. **Progressive Disclosure of Motion Parameters**:
   - Simple transitions are selected from a clean dropdown (`Fade`, `Slide Left`, `Scroll Down`). Advanced controls (scroll distance in pixels, spring bezier curves, dwell seconds) reveal themselves only when relevant.
4. **Immediate Interactive Feedback**:
   - Hotspot clicks produce expanding ripple rings (`clickPing`).
   - Timeline pips dynamically reflect elapsed dwell time.
   - Clipboard actions render transient checkmark confirmations (`Check` icon).
