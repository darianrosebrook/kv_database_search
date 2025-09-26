# SourceIcon

A primitive component for displaying source type icons with support for both emoji and SVG variants.

## Purpose

SourceIcon centralizes the source icon logic that was previously duplicated across `ResultCard` and `DocumentDetailView` components. It provides consistent icon representation for different source types while offering flexibility in presentation style.

## Usage

```tsx
import { SourceIcon } from "../ui/components/SourceIcon";

// Basic emoji usage (default)
<SourceIcon type="article" />

// SVG variant
<SourceIcon type="moc" variant="svg" />

// Different sizes
<SourceIcon type="book" size="sm" />
<SourceIcon type="conversation" size="lg" />

// With custom styling
<SourceIcon type="article" className="text-blue-500" />
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `type` | `string` | - | **Required.** The source type (moc, article, book, conversation, etc.) |
| `variant` | `"emoji" \| "svg"` | `"emoji"` | Icon style - emoji or SVG placeholder |
| `size` | `"sm" \| "md" \| "lg"` | `"md"` | Icon size |
| `className` | `string` | `""` | Additional CSS classes |

## Source Types

The component supports the following source types:

- **moc**: Map of Content (🗺️)
- **article**: Article/Document (📝)
- **book**: Book/Publication (📚)
- **conversation**: Chat/Discussion (💬)
- **default**: Generic document (📄)

## Variants

### Emoji Variant (default)
- Uses Unicode emoji icons
- Lightweight and accessible
- Consistent across platforms
- Responsive text sizing

### SVG Variant
- Custom placeholder SVG design
- Scalable vector graphics
- Consistent visual style
- Supports currentColor theming

## Sizes

- **sm**: 16x16px (text-sm)
- **md**: 24x24px (text-lg) - default
- **lg**: 32x32px (text-xl)

## Accessibility

- Uses semantic `img` role for screen readers
- Supports `aria-label` for source type description
- High contrast compatible
- Keyboard navigation friendly

## Design Tokens

The component uses design tokens for:
- Typography sizes (text.sm, text.lg, text.xl)
- Color inheritance (currentColor)
- Consistent spacing and sizing

## Migration Notes

This component was extracted from duplicated code in:
- `ResultCard.tsx` (getSourceIcon function with SVG placeholder)
- `DocumentDetailView.tsx` (getSourceIcon function with emoji icons)

The unified component provides both approaches through the `variant` prop, maintaining backward compatibility while eliminating duplication.
