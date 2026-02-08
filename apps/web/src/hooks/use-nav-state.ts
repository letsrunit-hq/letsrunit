import { useCookies } from '@/hooks/use-cookies';
import { useWindowSize } from '@/hooks/use-window-size';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

export type NavState = 'expanded' | 'collapsing' | 'collapsed' | 'hidden';

export function useNavState(user?: { isAnonymous?: boolean }) {
  const { width } = useWindowSize();
  const { getCookie, setCookie } = useCookies();
  const pathname = usePathname();
  const isManuallySet = useRef(false);

  const getInitialState = useCallback((): NavState => {
    const saved = getCookie('nav-preferences') as 'expanded' | 'collapsed' | undefined;
    const showNav = saved || (user && !user.isAnonymous);

    if (!showNav) return 'hidden';
    if (saved) return saved;
    if (width !== undefined) return width < 1920 ? 'collapsed' : 'expanded';
    return 'collapsed';
  }, [getCookie, user, width]);

  const [navState, setNavState] = useState<NavState>(getInitialState);

  // Sync state if width or user changes, but only if not manually overridden
  useEffect(() => {
    if (isManuallySet.current) return;

    setNavState((current) => {
      const saved = getCookie('nav-preferences') as 'expanded' | 'collapsed' | undefined;
      const showNav = saved || (user && !user.isAnonymous);

      if (!showNav) return 'hidden';
      if (saved) return saved;
      if (width !== undefined) {
        const next = width < 1920 ? 'collapsed' : 'expanded';
        if (next !== current) return next;
      }
      return current;
    });
  }, [width, user, getCookie]);

  const updateNavState = useCallback(
    (newState: NavState | ((prev: NavState) => NavState)) => {
      isManuallySet.current = true;
      setNavState((prev) => {
        const next = typeof newState === 'function' ? newState(prev) : newState;
        if (next === 'expanded' || next === 'collapsed') {
          setCookie('nav-preferences', next);
        }
        return next;
      });
    },
    [setCookie],
  );

  // Handle auto-setting cookie when visiting /projects
  useEffect(() => {
    if (pathname.startsWith('/projects')) {
      if (!getCookie('nav-preferences')) {
        const initialState = width !== undefined && width < 1920 ? 'collapsed' : 'expanded';
        setCookie('nav-preferences', initialState);
        updateNavState(initialState);
      }
    }
  }, [pathname, getCookie, updateNavState, width]);

  return [navState, updateNavState] as const;
}

export default useNavState;
