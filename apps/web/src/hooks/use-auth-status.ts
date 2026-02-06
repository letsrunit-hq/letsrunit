import { useSupabase } from '@/hooks/use-supabase';
import { isLoggedIn } from '@/libs/auth';
import { useEffect, useState } from 'react';

export function useAuthStatus() {
  const supabase = useSupabase();
  const [isLoggedInStatus, setIsLoggedInStatus] = useState<boolean | 'anonymous' | null>(null);

  useEffect(() => {
    if (!supabase) return;

    let mounted = true;

    const checkAuth = async () => {
      try {
        const status = await isLoggedIn({ supabase: supabase! });
        if (mounted) {
          setIsLoggedInStatus(status);
        }
      } catch (error) {
        if (mounted) {
          setIsLoggedInStatus(false);
        }
      }
    };

    checkAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      checkAuth();
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  return isLoggedInStatus;
}

export default useAuthStatus;
