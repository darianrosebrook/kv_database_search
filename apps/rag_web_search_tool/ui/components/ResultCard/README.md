# ResultCard Component

A reusable card component for displaying search results with rich metadata, confidence scoring, and interactive features.

## Features

- **Rich Content Display**: Shows title, summary, highlights, and expandable content
- **Confidence Scoring**: Visual indicators for result relevance
- **Source Information**: Displays source type, path, and metadata
- **Interactive Actions**: Copy, expand, add to context, and view source
- **Explanation Support**: Shows why this result matches the query
- **Responsive Design**: Works on different screen sizes

## Usage

```tsx
import ResultCard from './ui/components/ResultCard';

const searchResults = [
  {
    id: '1',
    title: 'Button Component',
    summary: 'A versatile button component for UI interactions',
    highlights: ['button', 'component'],
    confidenceScore: 0.95,
    source: {
      type: 'component',
      path: 'src/components/Button.tsx',
      url: 'https://example.com/component/button'
    },
    rationale: 'Matches query for button component',
    tags: ['ui', 'component', 'button'],
    lastUpdated: '2024-01-15'
  }
];

function SearchResults({ results, query, onSelect, onAddToContext }) {
  return (
    <div>
      {results.map((result, index) => (
        <ResultCard
          key={result.id}
          result={result}
          index={index}
          query={query}
          isSelected={result.id === selectedId}
          onSelect={onSelect}
          onAddToContext={onAddToContext}
        />
      ))}
    </div>
  );
}
```

## Props

### ResultCardProps

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `result` | `SearchResult` | Yes | The search result data to display |
| `index` | `number` | Yes | Index for animation ordering |
| `query` | `string` | Yes | The search query for highlighting |
| `isSelected` | `boolean` | Yes | Whether this result is currently selected |
| `onSelect` | `(result: SearchResult) => void` | Yes | Callback when result is clicked |
| `onAddToContext` | `(result: SearchResult) => void` | Yes | Callback when "Add to Context" is clicked |
| `className` | `string` | No | Additional CSS classes |

### SearchResult Interface

```typescript
interface SearchResult {
  id: string;
  title: string;
  summary: string;
  highlights: string[];
  confidenceScore: number;
  source: {
    type: "documentation" | "component" | "guideline";
    path: string;
    url: string;
  };
  rationale: string;
  tags: string[];
  lastUpdated: string;
  text?: string; // Full content for expansion
  meta?: {
    contentType: string;
    section: string;
    breadcrumbs: string[];
    uri?: string;
  };
}
```

## Styling

The component uses CSS modules with design tokens. Key styling features:

- **Confidence Indicators**: Color-coded based on confidence score
- **Source Icons**: Visual indicators for different source types
- **Hover States**: Interactive feedback for user actions
- **Responsive Layout**: Adapts to different container sizes
- **Animation**: Smooth transitions for expand/collapse

## Accessibility

- Keyboard navigation support
- Screen reader friendly
- ARIA labels for interactive elements
- High contrast support
- Focus management

## Dependencies

- React
- Lucide React (for icons)
- Motion (for animations)
- UI components (Badge, Button, Card, Skeleton, Separator)
