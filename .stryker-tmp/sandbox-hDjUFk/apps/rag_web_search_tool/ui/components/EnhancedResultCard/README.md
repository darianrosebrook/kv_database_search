# EnhancedResultCard

A compound component that displays search results with enhanced features including confidence scoring, explanations, and interactive actions.

## Usage

```tsx
import { EnhancedResultCard } from '@/ui/components/EnhancedResultCard';

function SearchResults() {
  const [selectedResult, setSelectedResult] = useState(null);
  const [contextResults, setContextResults] = useState([]);

  const handleSelect = (result) => {
    setSelectedResult(result);
  };

  const handleAddToContext = (result) => {
    setContextResults(prev => [...prev, result]);
  };

  return (
    <div>
      {results.map((result, index) => (
        <EnhancedResultCard
          key={result.id}
          result={result}
          index={index}
          query="design system"
          isSelected={selectedResult?.id === result.id}
          onSelect={handleSelect}
          onAddToContext={handleAddToContext}
        />
      ))}
    </div>
  );
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `result` | `SearchResult` | - | The search result data to display |
| `index` | `number` | - | Index for staggered animations |
| `query` | `string` | - | Search query for highlighting |
| `isSelected` | `boolean` | - | Whether this card is currently selected |
| `onSelect` | `function` | - | Callback when card is selected |
| `onAddToContext` | `function` | - | Callback to add result to chat context |
| `className` | `string` | `""` | Additional CSS classes |

## SearchResult Interface

```tsx
interface SearchResult {
  id: string;
  title: string;
  summary: string;
  highlights: string[];
  confidenceScore: number; // 0-1
  source: {
    type: "documentation" | "component" | "guideline";
    path: string;
    url: string;
  };
  rationale: string;
  tags: string[];
  lastUpdated: string;
  text?: string;
  meta?: {
    contentType: string;
    section: string;
    breadcrumbs: string[];
    uri?: string;
  };
}
```

## Features

### **Confidence Scoring**
- Visual confidence indicators with color coding
- High (≥80%): Green
- Medium (60-79%): Yellow  
- Low (<60%): Orange

### **Content Preview**
- Syntax highlighting for search terms
- Expandable content with "Show More/Less"
- Copy-to-clipboard functionality
- Hover states for interactive elements

### **AI Explanations**
- On-demand explanations of why results match
- Key insights extraction
- Suggested follow-up actions
- Loading states with skeletons

### **Interactive Actions**
- Add to chat context
- View original source
- Copy content
- Expand/collapse details

### **Responsive Design**
- Mobile-optimized layouts
- Touch-friendly interactions
- Adaptive spacing and typography

## Accessibility

- **Keyboard Navigation**: Full keyboard support with Enter/Space
- **Screen Reader**: Proper ARIA labels and announcements
- **Focus Management**: Visible focus indicators
- **Color Contrast**: WCAG AA compliant colors

## Animation

- Staggered entrance animations
- Smooth expand/collapse transitions
- Hover state transitions
- Loading state animations

## Design System Integration

- Uses semantic design tokens for all styling
- Follows compound component layer patterns
- Consistent with design system color palette
- Responsive breakpoint handling
