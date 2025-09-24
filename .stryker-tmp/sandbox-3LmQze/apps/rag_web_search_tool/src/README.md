# Obsidian RAG - Web Search Interface

A sophisticated AI-powered search interface for Obsidian knowledge bases that provides intelligent relevance scoring, source citations, and contextual rationale for search results from your personal knowledge vault.

## Vision & Purpose

This web interface enables seamless exploration of your Obsidian vault through advanced RAG (Retrieval-Augmented Generation) capabilities, transforming your personal knowledge base into an interactive, conversational research tool.

### Core Objectives

**🎯 Intelligent Discovery**: Surface relevant content from your Obsidian vault using semantic search with confidence scoring and detailed rationale for each result.

**🔗 Connected Knowledge**: Visualize relationships between notes through an interactive knowledge graph that shows how concepts in your vault connect.

**💬 Contextual Interaction**: Enable users to ask follow-up questions about search results through a conversational interface that understands the context of retrieved content.

**📊 Transparent Relevance**: Provide clear confidence scores, source citations, and explanations for why each result was selected and ranked.

**🎨 Progressive Enhancement**: Deliver a smooth, accessible experience that adapts from a simple search box to a comprehensive research interface.

## Key Features

### Semantic Search Capabilities
- **Vector Embeddings**: Advanced semantic understanding using local embedding models
- **Hybrid Ranking**: Combines semantic similarity with lexical matching for optimal results
- **Context-Aware**: Understands Obsidian's wikilinks, tags, and folder structure
- **Multi-Content Types**: Searches across MOCs, articles, conversations, and notes

### Interactive Experience
- **Real-time Search**: Instant results as you type with live updates
- **Conversational Chat**: Natural language conversations about your knowledge
- **Context Management**: Build conversations with relevant results from your vault
- **Source Navigation**: Direct links to content in your Obsidian vault
- **Follow-up Questions**: Ask targeted questions about specific content

### User Interface Features
- **Responsive Design**: Seamless experience across desktop and mobile devices
- **Accessibility**: Full keyboard navigation and screen reader support
- **Dark/Light Themes**: Automatic theme switching with consistent design
- **Progressive Layout**: Smooth transitions from search to detailed exploration

## Architecture & Implementation

### Progressive Layout Transition

The interface implements a sophisticated state-driven layout system that transforms from a centered search experience to a split-panel workspace:

```tsx
// Central to split layout transition using AnimatePresence
<AnimatePresence mode="wait">
  {!hasSearched ? (
    <motion.div key="initial" className="size-full flex items-center justify-center">
      // Centered search interface with vault branding
    </motion.div>
  ) : (
    <motion.div key="split" className="h-screen flex flex-col">
      // Split layout: chat left, results right
    </motion.div>
  )}
</AnimatePresence>
```

**Implementation Notes**:
- Uses `AnimatePresence` with `mode="wait"` for smooth transitions between layout states
- Layout transitions are triggered by the `hasSearched` state
- Maintains visual continuity through Motion's `layout` prop on the search input

### Motion-Based Animation System

Leverages Motion (formerly Framer Motion) for fluid, purposeful animations:

```tsx
// Staggered result card animations
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.4, delay: index * 0.1 }}
>
```

**Key Animation Patterns**:
- **Staggered Reveals**: Results appear with incremental delays for visual hierarchy
- **Layout Animations**: Search input smoothly adapts between centered and header positions
- **State Transitions**: Loading states and content updates use consistent easing curves
- **Micro-interactions**: Hover states and progressive disclosure enhance user feedback

### Data Hierarchy & Information Architecture

Organizes information for optimal scanning and comprehension:

**Result Cards Structure**:
```tsx
interface SearchResult {
  confidenceScore: number;      // Visual progress indicator for relevance
  highlights: string[];         // Contextual excerpts from your notes
  rationale: string;           // AI explanation in conversational language
  source: {                    // Rich source context with vault paths
    type: 'moc' | 'article' | 'conversation' | 'note';
    path: string;               // Path within your Obsidian vault
    url: string;                // Direct link to note in Obsidian
  };
  tags: string[];              // Tags from your note's frontmatter
  lastUpdated: string;         // When the note was last modified
}
```

**Design Principles**:
- **Visual Hierarchy**: Uses typography, color, and spacing instead of labels
- **Contextual Grouping**: Related information clusters together naturally
- **Progressive Disclosure**: Details revealed through interaction, not overwhelming initial view
- **Semantic Colors**: Confidence scores use green/yellow/orange for immediate understanding

### Component Architecture

Modular component design optimized for maintainability and responsive behavior:

```
/components/
├── SearchInput.tsx        # Adaptive search with vault-specific messaging
├── ChatInterface.tsx      # Conversation panel with message history
├── ResultsPanel.tsx       # Results container with sorting/filtering
├── ResultCard.tsx         # Individual result with vault metadata
└── KnowledgeGraph.tsx     # Graph visualization component
```

**Key Design Decisions**:
- **Layout Flexibility**: Components adapt to container constraints rather than fixed dimensions
- **State Co-location**: Related state managed at appropriate component levels
- **Prop Interface Design**: Clean, semantic props that reflect user intent
- **Accessibility First**: Proper ARIA labels, keyboard navigation, and screen reader support

### Performance & Loading States

Sophisticated loading and error states that maintain user confidence:

```tsx
// Contextual loading with meaningful feedback
{isLoading && (
  <div className="text-center space-y-4">
    <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    <div>
      <h3>Searching your vault...</h3>
      <p className="text-muted-foreground">Analyzing your notes and finding connections</p>
    </div>
  </div>
)}
```

**Loading UX Pattern**:
- **Contextual Messaging**: Explains what the system is doing during search
- **Visual Continuity**: Consistent spinner and layout preservation
- **Progressive Enhancement**: Interface remains functional during loading states
- **Error Boundaries**: Graceful fallbacks for API failures or network issues

### Styling System Integration

Built with Tailwind v4 and ShadCN components for consistent, maintainable styling:

**Key Styling Patterns**:
- **Design Token Usage**: Leverages CSS custom properties from `globals.css`
- **Component Composition**: ShadCN components provide base functionality with custom styling
- **Dark Mode Support**: Automatic theme switching through CSS custom properties
- **Responsive Design**: Mobile-first approach with progressive enhancement

**Notable Implementation**:
- No explicit font sizing classes (relies on base typography from `globals.css`)
- Semantic color usage (`text-muted-foreground`, `bg-card`) for theme consistency
- Consistent border radius and spacing through design tokens
- Motion-safe animations that respect user preferences

## Integration with Obsidian RAG System

### Backend Integration
- **API Integration**: Connects to the main Obsidian RAG backend system
- **Real-time Updates**: Maintains connection for live search results
- **Context Sharing**: Shares conversation context with the backend
- **Source Linking**: Provides direct links to content in your Obsidian vault

### Configuration
The interface expects the following environment configuration:
```env
DATABASE_URL=postgresql://user:pass@localhost:5432/obsidian_rag
OBSIDIAN_VAULT_PATH=/path/to/your/obsidian/vault
EMBEDDING_MODEL=embeddinggemma
PORT=3001
```

## Production Considerations

**Scalability**: Component architecture supports large vaults with efficient rendering and pagination patterns.

**Accessibility**: Implements WCAG 2.1 AA standards with keyboard navigation, screen reader support, and focus management.

**Performance**: Optimized for smooth 60fps animations with efficient re-rendering and lazy loading patterns.

**Error Handling**: Robust error boundaries and graceful fallbacks for network issues or API failures.

This implementation demonstrates how AI-powered search interfaces can transform personal knowledge management by making Obsidian vaults more discoverable, connected, and conversational while maintaining the familiar structure and organization users expect.