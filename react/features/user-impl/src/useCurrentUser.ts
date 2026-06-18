import { useState, useEffect } from 'react';
import { container } from '@gaev/container';
import { USER_SERVICE, type IUserService, type IUser } from '@gaev/user-contract';

export default function useCurrentUser(): { user: IUser | null; loading: boolean } {
  const [user, setUser] = useState<IUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const service = container.get<IUserService>(USER_SERVICE);
    service.getCurrentUser().then(u => {
      if (!cancelled) { setUser(u); setLoading(false); }
    });
    return () => { cancelled = true; };
  }, []);

  return { user, loading };
}
