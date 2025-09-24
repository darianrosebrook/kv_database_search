---
title: UI Components
created: 2024-01-03
tags: [ui, components, development]
---

# UI Components

Reusable interface elements that form the building blocks of user interfaces.

## Button Component

```typescript
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'outline';
  size: 'small' | 'medium' | 'large';
  disabled?: boolean;
  children: React.ReactNode;
}

function Button({ variant, size, disabled, children }: ButtonProps) {
  return (
    <button
      className={`btn btn-${variant} btn-${size}`}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
```

## Usage Examples

- Primary buttons for main actions
- Secondary buttons for alternative actions
- Outline buttons for less important actions

## Accessibility

- Keyboard navigation support
- Screen reader compatibility
- Focus management
- Color contrast compliance