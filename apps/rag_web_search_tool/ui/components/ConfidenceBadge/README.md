# ConfidenceBadge

A primitive component for displaying confidence scores with semantic color coding and consistent formatting.

## Purpose

ConfidenceBadge centralizes confidence score display logic that was previously duplicated across multiple components. It provides consistent visual representation of confidence levels with appropriate color coding and accessibility features.

## Usage

```tsx
import { ConfidenceBadge } from "../ui/components/ConfidenceBadge";

// Basic usage
<ConfidenceBadge score={0.85} />

// With icon
<ConfidenceBadge score={0.65} showIcon />

// Different variants and sizes
<ConfidenceBadge score={0.45} variant="secondary" size="sm" />

// High precision
<ConfidenceBadge score={0.8567} precision={2} />
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `score` | `number` | - | **Required.** Confidence score (0-1 range) |
| `variant` | `"default" \| "outline" \| "secondary"` | `"outline"` | Badge style variant |
| `size` | `"sm" \| "md" \| "lg"` | `"md"` | Badge size |
| `showIcon` | `boolean` | `false` | Whether to show confidence level icon |
| `precision` | `number` | `0` | Decimal places for percentage display |
| `className` | `string` | `""` | Additional CSS classes |

## Confidence Levels

The component automatically categorizes scores into three levels:

### High Confidence (≥ 80%)
- **Color**: Green (`text-green-600 dark:text-green-400`)
- **Icon**: ✓ (checkmark)
- **Meaning**: High reliability, strong match

### Medium Confidence (60-79%)
- **Color**: Yellow (`text-yellow-600 dark:text-yellow-400`)
- **Icon**: ~ (tilde)
- **Meaning**: Moderate reliability, good match

### Low Confidence (< 60%)
- **Color**: Orange (`text-orange-600 dark:text-orange-400`)
- **Icon**: ! (exclamation)
- **Meaning**: Lower reliability, weak match

## Features

### Semantic Color Coding
- Automatic color assignment based on confidence thresholds
- Dark mode compatible colors
- High contrast for accessibility

### Flexible Display Options
- Percentage formatting with configurable precision
- Optional confidence level icons
- Multiple size variants

### Accessibility
- `role="status"` for screen readers
- Descriptive `title` attribute with level and percentage
- `data-confidence-level` attribute for styling hooks
- High contrast color combinations

## Design Tokens

The component uses design tokens for:
- Typography sizes (text.xs, text.sm, text.base)
- Semantic colors (color.success, color.warning, color.error)
- Consistent spacing and styling

## Examples

```tsx
// Search result confidence
<ConfidenceBadge score={result.confidenceScore} />

// Entity confidence with icon
<ConfidenceBadge 
  score={entity.confidence} 
  showIcon 
  size="sm" 
  precision={2}
/>

// Reasoning confidence
<ConfidenceBadge 
  score={reasoning.confidence} 
  variant="secondary"
/>
```

## Migration Notes

This component was extracted from duplicated confidence display logic in:
- `ResultCard.tsx` (getConfidenceColor function and confidence display)
- `DocumentDetailView.tsx` (confidence percentage display)
- Various other components with confidence score formatting

The unified component provides consistent styling and behavior while eliminating code duplication.
