# SearchInput

A compound component that provides a search input field with submit button and optional description.

## Usage

```tsx
import { SearchInput } from '@/ui/components/SearchInput';

function App() {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = () => {
    setIsLoading(true);
    // Perform search
  };

  return (
    <SearchInput
      isInitial={true}
      query={query}
      onQueryChange={setQuery}
      onSubmit={handleSubmit}
      isLoading={isLoading}
    />
  );
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `isInitial` | `boolean` | - | Whether to show in initial (large) or compact mode |
| `query` | `string` | - | Current search query value |
| `onQueryChange` | `function` | - | Callback when query changes |
| `onSubmit` | `function` | - | Callback when form is submitted |
| `isLoading` | `boolean` | - | Whether search is in progress |
| `placeholder` | `string` | `"Search design system documentation..."` | Input placeholder text |
| `className` | `string` | `""` | Additional CSS classes |

## Variants

### Size
- **initial**: Large size for landing pages (max-width: 512px)
- **compact**: Smaller size for navigation bars (max-width: 384px)

## Accessibility

### ARIA Support
- `role="search"` on container
- `aria-label` on input and submit button
- Loading state communicated to screen readers

### Keyboard Navigation
- **Enter**: Submit search when input is focused
- **Escape**: Clear input when focused
- **Tab**: Move between input and submit button

### Screen Reader Support
- Search region is properly labeled
- Loading states are announced
- Button states (enabled/disabled) are communicated

## Design Tokens

The component uses the following design token categories:
- `searchInput.container.*` - Container sizing
- `searchInput.inputWrapper.*` - Input wrapper styling
- `searchInput.input.*` - Input field styling
- `searchInput.submitButton.*` - Submit button styling

## States

- **Default**: Ready for input
- **Focused**: Input has focus, shows focus ring
- **Loading**: Search in progress, button shows loading text
- **Disabled**: Input and button are disabled

## Related Components

- `Input` - Base input component
- `Button` - Base button component
