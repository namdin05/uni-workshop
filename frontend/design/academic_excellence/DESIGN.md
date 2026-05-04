---
name: Academic Excellence
colors:
  surface: '#f9f9fe'
  surface-dim: '#dad9de'
  surface-bright: '#f9f9fe'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f4f3f8'
  surface-container: '#eeedf2'
  surface-container-high: '#e8e8ed'
  surface-container-highest: '#e2e2e7'
  on-surface: '#1a1c1f'
  on-surface-variant: '#43474f'
  inverse-surface: '#2f3034'
  inverse-on-surface: '#f1f0f5'
  outline: '#737780'
  outline-variant: '#c3c6d1'
  surface-tint: '#3a5f94'
  primary: '#001e40'
  on-primary: '#ffffff'
  primary-container: '#003366'
  on-primary-container: '#799dd6'
  inverse-primary: '#a7c8ff'
  secondary: '#566067'
  on-secondary: '#ffffff'
  secondary-container: '#dae4ed'
  on-secondary-container: '#5c666d'
  tertiary: '#381300'
  on-tertiary: '#ffffff'
  tertiary-container: '#592300'
  on-tertiary-container: '#d8885c'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d5e3ff'
  primary-fixed-dim: '#a7c8ff'
  on-primary-fixed: '#001b3c'
  on-primary-fixed-variant: '#1f477b'
  secondary-fixed: '#dae4ed'
  secondary-fixed-dim: '#bec8d0'
  on-secondary-fixed: '#131d23'
  on-secondary-fixed-variant: '#3e484f'
  tertiary-fixed: '#ffdbca'
  tertiary-fixed-dim: '#ffb690'
  on-tertiary-fixed: '#341100'
  on-tertiary-fixed-variant: '#723610'
  background: '#f9f9fe'
  on-background: '#1a1c1f'
  surface-variant: '#e2e2e7'
typography:
  h1:
    fontFamily: Inter
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.02em
  h2:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  h3:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 24px
  lg: 48px
  xl: 80px
  container-max: 1280px
  gutter: 24px
---

## Brand & Style

This design system is built upon a **Corporate / Modern** aesthetic tailored for the academic and professional development sector. It prioritizes clarity, authority, and focus, evoking the disciplined atmosphere of a high-end university workshop. The visual language is intentionally restrained to reduce cognitive load, utilizing ample whitespace and a structured grid to facilitate learning and information retention.

The target audience includes students, educators, and industry professionals who require a reliable, distraction-free environment. The emotional response should be one of "Structured Innovation"—feeling established and trustworthy while remaining technologically forward-thinking through subtle modern accents.

## Colors

The palette is anchored by **Deep Professional Blue**, serving as the primary color for navigation, headers, and core branding elements to establish authority. **White** is the primary surface color to maintain a clean, paper-like readability essential for academic contexts.

**Accent Light Blue** is utilized for subtle UI layering, such as hover states, active menu backgrounds, and secondary container fills. Success and error states use traditional green and red tones, calibrated for high legibility against white backgrounds. A special **AI Accent** (a brighter, luminous blue) is reserved exclusively for intelligence-driven features to distinguish automated insights from static content.

## Typography

This design system employs **Inter** across all levels to ensure maximum legibility and a neutral, functional tone. The typographic hierarchy is strictly enforced to guide users through complex workshop curricula and data-heavy summaries.

Headlines use tighter letter spacing and heavier weights to provide strong visual anchoring. Body text is optimized for long-form reading with generous line heights. Labels and metadata use medium weights and slightly increased letter spacing to remain legible at smaller scales, ensuring that logistical details (like dates or pricing) are immediately scannable.

## Layout & Spacing

The layout follows a **Fixed Grid** model for primary content areas, centering the user's focus on a 1280px container. This mimics the structured format of an academic paper or a formal syllabus. 

A strictly linear 8px spacing system governs all spatial relationships. Margins and paddings are generous to prevent the interface from feeling cluttered. For dashboard views, a 12-column grid is used with 24px gutters, allowing for flexible card layouts that can span 3, 4, or 6 columns depending on the information density required.

## Elevation & Depth

This design system utilizes **Tonal Layers** and **Low-Contrast Outlines** to define hierarchy, avoiding heavy shadows to maintain a "flat-modern" academic feel. 

1.  **Level 0 (Floor):** The main background in White.
2.  **Level 1 (Card/Container):** Uses a 1px border in Accent Light Blue or a very soft, highly diffused 2% opacity neutral shadow.
3.  **Level 2 (Dropdowns/Modals):** Employs a slightly more pronounced ambient shadow (8% opacity) to indicate temporary interaction layers.

Depth is primarily communicated through color shifts (e.g., a light blue background for a section) rather than physical projection.

## Shapes

The design system adopts a **Soft** shape language. Standard UI elements like input fields, buttons, and small tags use a 4px (0.25rem) corner radius. This choice balances the rigidity of traditional academic institutions with the approachability of modern software. Large containers and workshop cards may scale up to an 8px radius to feel more inviting, but they never reach a "pill" shape, maintaining a professional architectural silhouette.

## Components

### Buttons
*   **Primary (Paid):** Deep Professional Blue fill with White text. Used for "Register" or "Buy Workshop."
*   **Secondary (Free):** White background with a Deep Professional Blue border or light blue fill.
*   **Success (Free Access):** Green fill used specifically when a workshop is tagged as "Free" to provide immediate positive reinforcement.

### Cards
Workshop cards use a white background with a 1px `secondary_color_hex` border. Content is stacked vertically: an optional header image, followed by a category tag, workshop title (H3), and instructor metadata.

### AI Summary Effect
The 'AI Summary' component features a unique **Luminous Glow**. This is achieved by applying a `0px 0px 15px` outer glow using the `ai_accent_hex` and a subtle 2px left-border gradient. The background of these specific cards should use a very faint gradient transition from White to a 5% opacity version of the AI Accent color.

### Input Fields & Selectors
Inputs utilize a 1px border in a neutral grey, which transitions to Deep Professional Blue on focus. Labels are always positioned above the field in `label-md` for maximum clarity.

### Chips/Tags
Small, low-profile badges used for categorizing topics (e.g., "Data Science," "Ethics"). These use the Accent Light Blue background with Deep Professional Blue text.