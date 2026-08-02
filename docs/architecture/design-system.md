# Design System

## Overview

SmartShopPOS uses a CSS variable-based design system built on Tailwind CSS v4, following a HSL (Hue, Saturation, Lightness) color model for precise color control and seamless dark mode transitions.

## Color Palette

### Primary Colors

- Primary: `hsl(222.2, 47.4%, 11.2%)` — Main brand color
- Primary Foreground: `hsl(210, 40%, 98%)` — Text on primary backgrounds

### Status Colors

- Success: `hsl(142.1, 76.6%, 36.4%)` — Success notifications, available stock
- Warning: `hsl(38.4, 92.1%, 50.4%)` — Warnings, low stock alerts
- Destructive: `hsl(0, 84.2%, 60.5%)` — Delete actions, errors
- Info: `hsl(201.4, 83.1%, 50.8%)` — Informational messages

### Neutral Colors

- Background: `hsl(0, 0%, 100%)` — Light mode
- Card: `hsl(0, 0%, 100%)` — Card backgrounds
- Border: `hsl(214.3, 32.1%, 91.2%)` — Input borders, dividers
- Muted: `hsl(210, 40%, 96.1%)` — Disabled states

### Dark Mode Variables

- Background: `hsl(222.2, 84% 4.9%)`
- Card: `hsl(222.2, 84% 4.9%)`
- Border: `hsl(214.3, 32.1%, 15.1%)`

## Typography

### Scale

- Display: `2.5rem` (40px) — Page titles
- h1: `2rem` (32px) — Section titles
- h2: `1.5rem` (24px) — Card headers
- h3: `1.25rem` (20px) — Subsection titles
- Body: `1rem` (16px) — Primary text
- Small: `0.875rem` (14px) — Secondary text
- Muted: `0.75rem` (12px) — Captions, labels

### Font Weights

- Bold: `700` — Totals, key metrics
- Semibold: `600` — Headers, labels
- Medium: `500` — Body text
- Normal: `400` — Secondary content

## Spacing

Uses Tailwind's default scale (0.25rem increments):

- `tight`: 0.5rem (8px) — Between form fields
- `normal`: 1rem (16px) — Between major sections
- `relaxed`: 1.5rem (24px) — Between components
- `loose`: 2rem (32px) — Between major sections

## Border Radius

- `sm`: 0.25rem (4px) — Small elements
- `DEFAULT`: 0.5rem (8px) — Cards, buttons
- `md`: 0.75rem (12px) — Dialogs
- `lg`: 1rem (16px) — Slide-up panels
- `full`: 9999px — Badges, pills

## Components

### Button

Variants:

- `primary` — Filled with primary color
- `secondary` — Secondary brand action
- `ghost` — Text-only, hover background
- `outline` — Border only
- `destructive` — Error/danger actions

Sizes:

- `sm` — 32px height
- `DEFAULT` — 40px height
- `lg` — 48px height
- `touch-target` — 44px minimum (mobile)

States:

- `loading` — Spinner with disabled state
- `disabled` — Reduced opacity, no hover

### Input

- `h-8` — Compact (forms)
- `h-10` — Standard (filters)
- `h-12` — Touch-friendly (POS)
- `text-lg` — Large numbers input

### Card

- Shadow: `0 1px 3px rgba(0,0,0,0.1)`
- Border: `1px solid var(--color-border)`
- Padding: `1rem` standard, `1.5rem` for content cards

## Utilities

### `touch-target`

Ensures minimum 44px × 44px tap target for mobile accessibility.

```css
.touch-target {
  min-height: 44px;
  min-width: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
```

### `scrollbar-hide`

Hides scrollbar while preserving scroll functionality.

```css
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
```

## POS-Specific Patterns

### Currency Display

- KES prefix: `KES {{ amount.toLocaleString() }}`
- Large totals: `text-3xl font-bold` (32px, 700 weight)
- Distance readable: Left-aligned, large font, high contrast

### Status Indicators

- Green: `text-green-600` — Online, open, success
- Red: `text-red-600` — Offline, closed, error
- Amber: `text-amber-600` — Warning, attention needed
- Muted: `text-muted-foreground` — Inactive, secondary

### Payment Methods

- Cash: Green (Banknote icon)
- Card: Blue (CreditCard icon)
- M-Pesa: Emerald (Smartphone icon)
- Bank: Purple (Landmark icon)
- Split: Amber (Plus icon)
