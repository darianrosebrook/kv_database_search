/**
 * Next.js Navigation hooks alternative for Vite/React
 * Provides similar API to Next.js navigation hooks
 */
import { useCallback } from "react";

export interface NavigationOptions {
  scroll?: boolean;
  shallow?: boolean;
}

export const useRouter = () => {
  const push = useCallback((href: string, options?: NavigationOptions) => {
    window.location.href = href;
  }, []);

  const replace = useCallback((href: string, options?: NavigationOptions) => {
    window.location.replace(href);
  }, []);

  const back = useCallback(() => {
    window.history.back();
  }, []);

  const forward = useCallback(() => {
    window.history.forward();
  }, []);

  const refresh = useCallback(() => {
    window.location.reload();
  }, []);

  return {
    push,
    replace,
    back,
    forward,
    refresh,
    pathname: window.location.pathname,
    query: new URLSearchParams(window.location.search),
    asPath: window.location.pathname + window.location.search,
  };
};

export const usePathname = () => {
  return window.location.pathname;
};

export const useSearchParams = () => {
  return new URLSearchParams(window.location.search);
};
