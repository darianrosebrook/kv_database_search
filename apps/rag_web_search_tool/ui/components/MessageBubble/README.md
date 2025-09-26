# MessageBubble

A compound component for rendering chat messages with support for Graph RAG enhancements including entities, reasoning, and provenance information.

## Purpose

MessageBubble consolidates the message rendering logic that was previously duplicated across `UnifiedChatInterface` and `GraphRagChatInterface`. It provides consistent styling and behavior for all message types while supporting optional Graph RAG features.

## Usage

```tsx
import { MessageBubble } from "../ui/components/MessageBubble";

// Basic usage
<MessageBubble message={message} />

// With Graph RAG features
<MessageBubble
  message={message}
  useGraphRag={true}
  onExploreEntity={(entity) => console.log('Explore entity:', entity)}
  onExploreRelationship={(relationship) => console.log('Explore relationship:', relationship)}
/>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `message` | `EnhancedMessage` | - | **Required.** The message object to render |
| `useGraphRag` | `boolean` | `false` | Whether to enable Graph RAG specific features |
| `onExploreEntity` | `(entity: GraphRagEntity) => void` | - | Callback when an entity is clicked |
| `onExploreRelationship` | `(relationship: GraphRagRelationship) => void` | - | Callback when a relationship is clicked |
| `className` | `string` | `""` | Additional CSS classes |

## Message Types

The component supports four message types with distinct styling:

- **user**: Primary background, right-aligned
- **assistant**: Secondary background, left-aligned  
- **error**: Destructive background, left-aligned
- **system**: Muted background, left-aligned

## Features

### Core Features
- Message type icons and timestamps
- Confidence scores and search result counts
- Animated entrance with motion/react
- Responsive max-width (80%)

### Graph RAG Features (when `useGraphRag` is true)
- **Entities**: Interactive buttons for exploring entities
- **Reasoning**: Display of reasoning paths and confidence
- **Provenance**: Quality metrics grid

### Accessibility
- Semantic HTML structure
- Proper color contrast for all message types
- Keyboard accessible entity buttons
- Screen reader friendly timestamps and metadata

## Design Tokens

The component uses design tokens for:
- Spacing (gaps, padding, margins)
- Colors (backgrounds, text, borders)
- Typography (text sizes)
- Border radius

## Animation

Uses Framer Motion for:
- Fade in animation (opacity: 0 → 1)
- Slide up animation (y: 10 → 0)
- Smooth transitions on interactive elements

## Related Components

- `UnifiedChatInterface` - Uses MessageBubble for rendering messages
- `GraphRagChatInterface` - Uses MessageBubble for rendering messages
- Design system components: Uses design tokens and follows compound layer patterns

## Migration Notes

This component was extracted from duplicated code in:
- `UnifiedChatInterface.tsx` (renderMessage function)
- `GraphRagChatInterface.tsx` (message rendering logic)

The extraction eliminates ~100 lines of duplicated code while maintaining identical functionality.
