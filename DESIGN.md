# SparkExchange design system

This records the existing SparkExchange identity and its narrow Live TV extension. The repository is the visual authority; this work introduces no new brand. Product scope is defined in [PRODUCT.md](PRODUCT.md), with the addition's direction in [.impeccable/surfaces/live-tv.md](.impeccable/surfaces/live-tv.md).

## Incumbent foundations

`src/app/layout.tsx` sets the document to dark mode and loads Inter through `next/font/google`. Its legacy CSS variable name is `--font-geist-sans`; the actual font is Inter. `src/app/globals.css` maps semantic HSL variables to Tailwind theme colors.

| Role | Dark-mode source value | Use |
| --- | --- | --- |
| Background | `240 10% 4%` | Page and recessed controls |
| Foreground | `0 0% 98%` | Primary text |
| Card / popover | `240 10% 6%` | Raised surfaces |
| Card / popover foreground | `0 0% 98%` | Surface text |
| Primary / accent / ring | `47 87% 50%` | Gold emphasis and focus |
| Primary / accent foreground | `0 0% 98%` | Existing semantic defaults |
| Secondary / muted | `240 5% 15%` | Subtle emphasis and selection |
| Secondary foreground | `0 0% 98%` | Secondary surface text |
| Muted foreground | `0 0% 64%` | Supporting text |
| Border / input | `240 5% 17%` | Dividers and control outlines |
| Destructive | `0 62.8% 30.6%` | Existing destructive role |
| Destructive foreground | `0 0% 98%` | Existing destructive text |

The source also retains light-mode and chart variables. Dark mode is the active landing-page presentation. Live TV consumes the dark semantic roles; its Stop action explicitly uses black text on gold and the video canvas is black.

Inter bold section headings use `text-3xl md:text-4xl` (30px, then 36px from Tailwind's 768px breakpoint), matching the existing guide, features, FAQ and contact sections. Introductions use `text-lg` (18px) and muted foreground. Shared buttons use 14px medium text, named variants and visible focus rings. Lucide SVG icons provide the existing icon vocabulary.

The radius foundation is `--radius: 0.75rem` (12px); theme radii are 8px, 10px, 12px and 16px. Existing surfaces also use larger rounded corners. Layout uses `container mx-auto px-4` and generous section spacing. The incumbent site includes gold gradient text, gradient buttons, soft glows, animated decoration and glass surfaces. These are existing conventions, preserved without a redesign or broad cleanup.

## Live TV addition

`LiveTVSection` sits after the guide video and before the speed test. Its charcoal card, gold emphasis, Inter typography, native form controls, shared Button component and Lucide icons inherit the landing page. It uses a 16px outer shell and 12px video corners; search, select and channel rows use 10px corners. It adds no illustration or embedded provider webpage.

Above 900px, a 250–310px channel browser sits left of the flexible video pane. Both panes have 24px padding. The 16:9 video uses `object-fit: contain`. Search, favorites, category, count, bounded channel list and progressive Load more form the browser; the video pane carries selected-channel text, Full screen, Stop and playback status. The list is bounded to 460px with internal scrolling.

At 900px and below, the video pane is first and the channel browser follows, with 16px padding and a dividing border. The list is bounded to `50dvh`, controls wrap, and long names can break. Caption actions start wrapping at 1100px. Section vertical padding is 80px by default, 64px at 900px and below, and 112px from 1280px. An 88px scroll margin accommodates the fixed header. Desktop navigation and its exchange CTA begin at 1280px (`xl`); the menu control handles narrower widths, keeping the added link from crowding the header.

## Interaction and state conventions

The directory loads near the viewport and offers loading, error/retry and empty-filter states. Search, category and favorites narrow the list; favorites persist locally when storage is available. Load more reveals the next 100 entries. Channel selection starts playback; entering the section does not autoplay. Public feeds can be offline or region restricted, and recovery messages describe that uncertainty.

The player exposes native controls, connecting/playing/stopped/failure status, Full screen and Stop. Named controls, pressed state for selection and favorites, live status text, gold focus outlines and at least 44px action targets support operation. Mobile selection scrolls toward the video and respects reduced motion. Media and request cleanup are implemented in the component. These are source-observed behaviors, not a decoded-video certification.

## Review record and limits

Disposition: **ship at code and structure scope**, with no material design findings in that scope. Evidence inspected: `PRODUCT.md`, the Live TV direction, `src/app/globals.css`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/components/header.tsx`, `src/components/video-section.tsx`, `src/components/ui/button.tsx`, `src/components/live-tv-section.tsx` and `src/components/live-tv.module.css`.

No graphical screenshot, device rendering or decoded-video review is certified by this record. The Impeccable `references/document.md` resource could not be loaded; cloud skills were unavailable. Documentation follows the supplied task constraints and actual repository tokens. This documentation pass changes only `DESIGN.md` and `.impeccable/design.json`.
