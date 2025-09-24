# ChatInterface

A composer-level component that provides a complete chat interface for interacting with search results and AI assistance.

## Usage

```tsx
import { ChatInterface } from '@/ui/components/ChatInterface';

function App() {
  const [messages, setMessages] = useState([]);
  const [contextResults, setContextResults] = useState([]);

  const handleSendMessage = (message, options) => {
    // Handle message sending logic
  };

  return (
    <ChatInterface
      initialQuery=""
      messages={messages}
      onSendMessage={handleSendMessage}
      isLoading={false}
      contextResults={contextResults}
      onRemoveContext={(id) => {
        setContextResults(prev => prev.filter(r => r.id !== id));
      }}
    />
  );
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `initialQuery` | `string` | - | Initial search query |
| `messages` | `Message[]` | - | Array of chat messages |
| `onSendMessage` | `function` | - | Callback when user sends a message |
| `isLoading` | `boolean` | `false` | Whether the chat is loading |
| `resultsCount` | `number` | - | Number of search results available |
| `contextResults` | `SearchResult[]` | `[]` | Search results used as context |
| `onRemoveContext` | `function` | - | Callback to remove context result |
| `suggestedActions` | `SuggestedAction[]` | `[]` | Suggested follow-up actions |
| `onSuggestedAction` | `function` | - | Callback for suggested action clicks |

## Accessibility

### ARIA Support
- `role="region"` with `aria-label="Chat interface"`
- Live region for message announcements
- Proper focus management between input and messages

### Keyboard Navigation
- **Tab**: Navigate between interactive elements
- **Enter**: Send message when input is focused
- **Escape**: Clear input when focused

### Screen Reader Support
- Messages are announced as they arrive
- Context changes are communicated
- Loading states are announced

## Design Tokens

The component uses the following design token categories:
- `chatInterface.container.*` - Main container styling
- `chatInterface.header.*` - Header section styling
- `chatInterface.message.*` - Message styling
- `chatInterface.suggestions.*` - Suggestions styling

## States

- **Empty**: No messages, shows welcome state
- **HasMessages**: Shows message history
- **Loading**: Shows loading indicator
- **HasContext**: Shows context chips when search results are selected

## Related Components

- `Button` - For action buttons
- `ScrollArea` - For message scrolling
- `ContextChip` - For displaying context items
- `EnhancedChatInput` - For message input
- `MessageContent` - For rendering message content
- `LoadingSkeleton` - For loading states
