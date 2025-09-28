/**
 * Next.js Dynamic component alternative for Vite/React
 * Provides similar API to Next.js dynamic imports
 */
import React, { Suspense, ComponentType } from "react";

export interface LazyLoadOptions {
  loading?: () => React.ReactNode;
  ssr?: boolean;
}

export const dynamic = <P extends object>(
  importFunc: () => Promise<{ default: ComponentType<P> }>,
  options: LazyLoadOptions = {}
) => {
  const LazyComponent = React.lazy(importFunc);

  const DynamicComponent: React.FC<P> = (props) => {
    return (
      <Suspense fallback={options.loading?.() || <div>Loading...</div>}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };

  // Set display name if available
  try {
    if ((LazyComponent as any).displayName) {
      DynamicComponent.displayName = `Dynamic(${
        (LazyComponent as any).displayName
      })`;
    }
  } catch {
    // Ignore displayName setting if not available
  }

  return DynamicComponent;
};

export default dynamic;
