# Component Migration Guide

This guide outlines the migration from Tailwind-based components to design system components.

## Migration Progress

### ✅ Completed Components

#### ChatInterface
- **Location**: `ui/components/ChatInterface/`
- **Status**: ✅ Migrated
- **Changes**:
  - Extracted all Tailwind classes to SCSS modules
  - Created design token mappings
  - Added component contract and accessibility documentation
  - Follows composer layer pattern

#### SearchInput  
- **Location**: `ui/components/SearchInput/`
- **Status**: ✅ Migrated
- **Changes**:
  - Extracted all Tailwind classes to SCSS modules
  - Created design token mappings
  - Added component contract and accessibility documentation
  - Follows compound layer pattern

#### ResultCard
- **Location**: `ui/components/ResultCard/`
- **Status**: ✅ Migrated
- **Changes**:
  - Extracted all Tailwind classes to SCSS modules
  - Created comprehensive design token mappings (40+ tokens)
  - Added component contract and accessibility documentation
  - Follows compound layer pattern
  - Fixed all hardcoded color violations

#### ContextChip
- **Location**: `ui/components/ContextChip/`
- **Status**: ✅ Migrated
- **Changes**:
  - Extracted all Tailwind classes to SCSS modules
  - Created design token mappings
  - Added component contract and accessibility documentation
  - Follows primitive layer pattern

#### ChatInput (formerly EnhancedChatInput)
- **Location**: `ui/components/ChatInput/`
- **Status**: ✅ Migrated
- **Changes**:
  - Renamed from EnhancedChatInput to ChatInput (complete replacement)
  - Extracted all Tailwind classes to SCSS modules
  - Created comprehensive design token mappings (25+ tokens)
  - Added component contract and accessibility documentation
  - Follows compound layer pattern
  - Updated ChatInterface to use new ChatInput

### ❌ Pending Migration
- **Status**: ❌ Not Started
- **Current Issues**: Uses Tailwind classes directly


#### MessageContent
- **Status**: ❌ Not Started
- **Current Issues**: Uses Tailwind classes directly

#### LoadingSkeleton
- **Status**: ❌ Not Started
- **Current Issues**: Uses Tailwind classes directly

## Migration Steps

### 1. Extract Tailwind Classes
```tsx
// Before (Tailwind)
<div className="bg-card border border-border rounded-xl shadow-sm">

// After (SCSS Module)
<div className={styles.container}>
```

### 2. Create Token Mappings
```json
{
  "container": {
    "background": "{semantic.color.background.elevated}",
    "border": "{semantic.color.border.subtle}",
    "borderRadius": "{semantic.shape.radius.large}",
    "shadow": "{semantic.elevation.surface.raised}"
  }
}
```

### 3. Generate SCSS Variables
```scss
.container {
  background: var(--component-container-background);
  border: 1px solid var(--component-container-border);
  border-radius: var(--component-container-borderRadius);
  box-shadow: var(--component-container-shadow);
}
```

### 4. Update Component Structure
```
ComponentName/
├── index.tsx                    # Export entry point
├── ComponentName.tsx           # Component implementation
├── ComponentName.module.scss   # Styles using design tokens
├── ComponentName.tokens.json   # Token mappings
├── ComponentName.tokens.generated.scss # Auto-generated (do not edit)
├── ComponentName.contract.json # Component contract
└── README.md                   # Documentation
```

## Import Updates

### Before Migration
```tsx
import { ChatInterface } from '../components/ChatInterface';
import { SearchInput } from '../components/SearchInput';
```

### After Migration
```tsx
import { ChatInterface } from '../ui/components/ChatInterface';
import { SearchInput } from '../ui/components/SearchInput';
```

## Token Build Process

### Available Scripts
```bash
npm run tokens:compose    # Compose core + semantic tokens
npm run tokens:globals    # Generate global CSS variables
npm run tokens:scss       # Generate component-specific SCSS
npm run tokens:types      # Generate TypeScript types
npm run tokens:build      # Run all token generation steps
```

### Workflow
1. Update component `.tokens.json` file
2. Run `npm run tokens:scss` to regenerate SCSS variables
3. Update component SCSS module to use new variables
4. Test component in isolation

## Design System Compliance

### ✅ Compliant Components
- Use design tokens exclusively
- Have component contracts
- Include accessibility documentation
- Follow proper component layer classification
- Use modern SCSS nesting

### ❌ Non-Compliant Components
- Use hardcoded colors/values
- Mix Tailwind classes with design system
- Missing component contracts
- No accessibility documentation
- Don't follow component layer patterns

## Next Steps

1. **High Priority**: Migrate `ResultCard` (removes hardcoded colors)
2. **Medium Priority**: Migrate remaining chat components
3. **Low Priority**: Create shared component library exports
4. **Cleanup**: Remove unused Tailwind dependencies

## Benefits After Migration

- **Consistency**: All components use the same design tokens
- **Maintainability**: Centralized styling system
- **Accessibility**: Built-in a11y patterns
- **Documentation**: Self-documenting component contracts
- **Performance**: Optimized CSS output
- **Developer Experience**: Better IntelliSense and validation
