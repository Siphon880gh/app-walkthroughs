---
name: StoryFlow Studio
description: Developer-ready design system for the StoryFlow Studio walkthrough and flow engineering workbench.
colors:
  primary: "#3b82f6"
  primary-hover: "#2563eb"
  primary-subtle: "rgba(59, 130, 246, 0.15)"
  secondary: "#6366f1"
  emerald: "#10b981"
  amber: "#f59e0b"
  red: "#ef4444"
  purple: "#8b5cf6"
  cyan: "#06b6d4"
  neutral-bg: "#020617"
  neutral-surface: "#0f172a"
  neutral-surface-raised: "#1e293b"
  neutral-border: "#1e293b"
  neutral-border-subtle: "#334155"
  neutral-text: "#f8fafc"
  neutral-text-muted: "#94a3b8"
  neutral-text-dim: "#64748b"
typography:
  display:
    fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.015em"
  title:
    fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "normal"
  body:
    fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "'JetBrains Mono', monospace"
    fontSize: "0.6875rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.05em"
rounded:
  sm: "4px"
  md: "6px"
  lg: "8px"
  xl: "12px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.neutral-text}"
    rounded: "{rounded.md}"
    padding: "6px 12px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
    textColor: "{colors.neutral-text}"
    rounded: "{rounded.md}"
    padding: "6px 12px"
  button-secondary:
    backgroundColor: "{colors.neutral-surface-raised}"
    textColor: "{colors.neutral-text}"
    rounded: "{rounded.md}"
    padding: "6px 12px"
---

# Design System: StoryFlow Studio

## Overview

**Creative North Star: "The Avionics Cockpit"**

StoryFlow Studio is designed as a focused, dark-mode-first instrument panel for modern software architects, designers, and engineers. Every pixel is weighted toward information density, legibility, and high-frequency productivity. The interface stays out of the user's way, treating the user's screenshots and flow sequences as the primary illuminated artifacts within an expansive midnight slate environment.

Rather than using generic rounded cards or low-contrast light themes, StoryFlow Studio utilizes deep obsidian and slate foundations (`slate-950` and `slate-900`), razor-thin architectural boundaries (`slate-800`), crisp electric-blue interactive highlights, and monospaced telemetry tags. Tooling panels, scrubber timelines, and annotation palettes are positioned within thumb and cursor reach, reinforcing an atmosphere of precision engineering.

### Key Characteristics
- **Deep Midnight Slate Architecture**: 100% dark theme optimized for sustained analytical work without eye fatigue.
- **Architectural Edge Precision**: 1px structural dividing lines with crisp `slate-800` borders and subtle `slate-700/60` interactive borders.
- **Dual-Type Foundry**: Technical sans-serif (`Plus Jakarta Sans`) paired with precision monospaced numerals and metadata (`JetBrains Mono`).
- **High-Contrast Telemetry**: Color-coded functional chips (blue for iOS/primary, indigo for web, emerald for settled/balance, amber for iPad/review, red for destructive actions).
- **Zero-Distraction Stage**: Viewports and mockup frames remain centered with generous margins and subtle backdrops.

---

## Colors

The color palette centers on neutral slate tones ranging from deep obsidian black to crisp white, with electric blue and indigo serving as the primary interactive accelerators.

### Primary
- **Electric Blue** (`#3B82F6` / `rgb(59, 130, 246)`): The primary action and brand accent. Used for active tabs, primary call-to-action buttons, active step highlights, scrubber progress fills, and primary selection outlines.
- **Deep Blue Hover** (`#2563EB`): The active interaction state for primary buttons.
- **Primary Subtle** (`rgba(59, 130, 246, 0.15)`): The background fill for active navigation items, selected dropdown rows, and subtle highlight callouts.

### Secondary & Accents
- **Indigo Accent** (`#6366F1`): Secondary accent representing desktop platforms, code exports, and secondary actions.
- **Emerald** (`#10B981`): Status indicator for live playback, positive financial tags, and successful transactions.
- **Amber** (`#F59E0B`): Warning states, tablet/iPad device indicators, and review actions.
- **Red** (`#EF4444`): Destructive actions (deleting steps, screenshots, or folders), error notices, and priority callout pins.
- **Purple** (`#8B5CF6`): Secondary annotations and generative AI workflow tags.
- **Cyan** (`#06B6D4`): Measurement callouts and auxiliary interface highlights.

### Neutral
- **Background Root** (`#020617` / `slate-950`): The overarching application canvas and viewport backdrop.
- **Surface Level 1** (`#0F172A` / `slate-900`): Sidebars, top navigation bar, modal backgrounds, and drawer surfaces.
- **Surface Level 2** (`#1E293B` / `slate-800`): Cards, unselected buttons, scrubber tracks, input backgrounds, and dividers.
- **Border Default** (`#1E293B` / `slate-800`): Canonical structural divider border between major application panes.
- **Border Interactive** (`rgba(51, 65, 85, 0.6)` / `slate-700/60`): Hover and focus borders on interactive buttons and inputs.
- **Text Primary** (`#F8FAFC` / `slate-100`): Primary headings, titles, active labels, and step names.
- **Text Secondary** (`#94A3B8` / `slate-400`): Subtitles, helper text, inactive icons, and metadata keys.
- **Text Muted** (`#64748B` / `slate-500`): Timestamps, keyboard shortcuts, and disabled states.

### Named Rules
**The Instrument Contrast Rule**: Decorative gradients and non-semantic color washes are prohibited on functional controls. Color is reserved exclusively for state (active/inactive), semantic categories (platform/status), or deliberate user-drawn annotations.

---

## Typography

**Display & Body Font:** `Plus Jakarta Sans` (Google Fonts, with `-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif` fallbacks).  
**Monospaced Technical Font:** `JetBrains Mono` (Google Fonts, with `monospace` fallback).

**Character:** Technical, clean, geometric sans-serif that maintains immaculate legibility at dense sizes (11px–13px), coupled with a developer-focused monospace font for step counters, telemetry, coordinates, and timings.

### Hierarchy
- **Display** (700 weight, `1.25rem` / `20px` to `1.5rem` / `24px`, line-height `1.2`): Project headers and modal titles.
- **Headline** (600 weight, `1rem` / `16px` to `1.125rem` / `18px`, line-height `1.3`): Section headers (e.g., "Story Builder", "Annotation Studio", "Recent Transfers").
- **Title** (600 weight, `0.875rem` / `14px`, line-height `1.4`): Step cards, dropdown items, button labels.
- **Body** (400–500 weight, `0.75rem` / `12px` to `0.8125rem` / `13px`, line-height `1.5`): Narrative descriptions, analytical notes, form input labels.
- **Label / Monospace** (500–600 weight, `0.6875rem` / `11px`, letter-spacing `0.05em`): Step pips ("Step 2 of 4"), timing chips ("0.6s ease-in-out"), coordinate tags ("(50%, 50%)"), and platform tags.

### Named Rules
**The Tabular Number Rule**: All step indices, duration badges, and progress percentages must use monospace tabular numerals (`font-mono` or `tabular-nums`) to prevent jitter during real-time timeline scrubber updates.

---

## Layout

### Grid and Workspace Architecture
The application runs as a full-viewport, zero-scroll master frame (`h-screen w-screen overflow-hidden`):
1. **Top Bar (Header)**: Fixed 52px height (`py-3 px-6`), sticky at top, glass-morphism background (`bg-slate-900/90 backdrop-blur-md`), housing brand badge, new project action, project selector, and primary view navigation pills.
2. **Main Split Stage**: Fills remaining vertical height (`flex-1 flex overflow-hidden`).
   - **Left Explorer Pane (FolderSidebar)**: 256px fixed width (`w-64`), containing folder hierarchy, app/platform filters, screenshot count badges, and folder creation modal.
   - **Center Workspace Canvas**: Dynamic flex container hosting the active view (`ScreenshotGallery`, `AnnotationStudio`, `StoryBuilder`, `PlaybackPlayer`, or `ExportView`).
   - **Right Context Inspector** (in Studio & Story Builder): 320px–360px contextual property inspector with tabs for behavioral metadata, transitions, interactions, and step settings.

### Spacing Rhythm
- **4px (`p-1`)**: Micro-gaps between icons and badge text.
- **8px (`p-2`, `gap-2`)**: Standard compact button padding and list item separation.
- **12px (`p-3`, `gap-3`)**: Form field vertical rhythm and header horizontal padding.
- **16px (`p-4`, `gap-4`)**: Sidebar section padding and card content padding.
- **24px (`p-6`, `gap-6`)**: Major container borders, modal interior margins, and top bar padding.

---

## Elevation & Depth

StoryFlow Studio eschews heavy, blurry drop shadows in favor of **structural tonal layering** and **fine-line luminous borders**. Depth is established by elevating brightness across three discrete surface tiers:
- Tier 0: Background Canvas (`slate-950`, `#020617`).
- Tier 1: Panels and Sidebars (`slate-900`, `#0F172A`).
- Tier 2: Floating Cards and Dropdowns (`slate-850`/`slate-800`, `#1E293B`) with `shadow-xl` or `shadow-2xl`.

### Shadow Vocabulary
- **Subtle Surface** (`shadow-sm`): Applied to button controls and step thumbnails (`0 1px 2px 0 rgb(0 0 0 / 0.05)`).
- **Raised Flyout** (`shadow-xl`): Applied to dropdown menus and popovers (`0 20px 25px -5px rgb(0 0 0 / 0.5), 0 8px 10px -6px rgb(0 0 0 / 0.5)`).
- **Modal Overlay** (`shadow-2xl`): Applied to the Audio Settings and Project Creation modals (`0 25px 50px -12px rgb(0 0 0 / 0.7)`).
- **Interactive Focus Ring** (`ring-2 ring-blue-500/40`): Indicates keyboard focus and active selected steps.

---

## Shapes

- **Base Radius**: `rounded-md` (6px) for action buttons, input fields, and small tags.
- **Card Radius**: `rounded-lg` (8px) to `rounded-xl` (12px) for step cards, screenshot tiles, and modal dialogs.
- **Pill Radius**: `rounded-full` (9999px) for scrubber tracks, status pips, avatar badges, and audio volume thumbs.
- **Device Frame Mockup Profiles**:
  - **iPhone Frame**: `rounded-[42px]` outer bezel, high-gloss border (`border-[8px] border-slate-800`), Dynamic Island pill (`w-24 h-6 bg-slate-900 rounded-full`).
  - **Android Frame**: `rounded-[32px]` outer bezel, centered camera punch-hole (`w-3.5 h-3.5 bg-slate-900 rounded-full`).
  - **Desktop Frame**: `rounded-lg` browser frame, top browser chrome header (`h-8 bg-slate-800 flex items-center px-3`), traffic light window controls (red, yellow, green 10px dots).

---

## Components

### Buttons
- **Primary Button**: Solid Blue (`bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs px-3 py-1.5 rounded-md transition-colors shadow-sm`).
- **Secondary Button**: Neutral Slate (`bg-slate-800/90 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700/60 text-xs px-2.5 py-1.5 rounded-md`).
- **Ghost Button**: Transparent with hover background (`hover:bg-slate-800 text-slate-400 hover:text-white p-1.5 rounded-md transition-colors`).
- **Destructive Button**: Crimson accent (`hover:bg-red-500/20 text-slate-400 hover:text-red-400 p-1.5 rounded-md transition-colors`).

### View Selector Pills (TopBar)
- Inactive: `text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5`.
- Active: `bg-blue-600/20 text-blue-400 border border-blue-500/30 px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5`.

### Step Timeline Pips (PlaybackPlayer)
- Inactive: `h-2 rounded-full bg-slate-800 hover:h-2.5 transition-all`.
- Passed Step: `bg-blue-500 w-full`.
- Active Step: Real-time progress bar fill `bg-blue-400` advancing from 0% to 100% over the step's dwell duration.

### Interactive Hotspot Ping
- Animated pulsing rings (`animate-ping bg-blue-500/40 rounded-full`) with a centered cursor pointer icon (`MousePointer` / `Hand`), creating an unmistakable invitation to click.

### Form Inputs & Textareas
- Base: `bg-slate-950/80 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-md text-xs text-slate-100 placeholder:text-slate-600 px-3 py-2 transition-colors`.

---

## Do's and Don'ts

### Do:
- **Do** maintain the dark theme palette across all views; never switch to light background cards or high-glare white canvases.
- **Do** format all numerical counters, timings, and coordinates using `font-mono` (`JetBrains Mono`).
- **Do** keep behavioral annotations organized under the 3 canonical analytical headings: *"1. What the User is Doing"*, *"2. What is Visible on Screen"*, and *"3. What Should Happen Next"*.
- **Do** preserve 1px `border-slate-800` structural separators between navigation, canvas, and inspector panels.
- **Do** provide instant visual feedback on interactive actions (e.g., clipboard copy checkmarks, ripple pings on hotspot clicks).

### Don't:
- **Don't** add decorative, non-functional background gradients or distracting parallax effects that compete with user screenshots.
- **Don't** use browser native alert popups for recurring feedback when inline toasts or unobtrusive badges are appropriate.
- **Don't** allow screenshot images to stretch or distort; maintain natural aspect ratios within simulated device bezels (`object-contain`).
- **Don't** hide step transitions behind obscure sub-menus; expose duration and easing directly within the story sequencer.
