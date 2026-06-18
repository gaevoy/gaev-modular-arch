import { useState, useEffect } from 'react';
import type { ComponentType } from 'react';
import { resolveAsync } from '@gaev/container';
import {
  USER_AVATAR,
  USER_SERVICE,
  type UserAvatarProps,
  type IUserService,
  type IUser
} from '@gaev/user-contract';

const [UserAvatar, userService] = await Promise.all([
  resolveAsync<ComponentType<UserAvatarProps>>(USER_AVATAR),
  resolveAsync<IUserService>(USER_SERVICE),
]);

export default function UserPage() {
  const [user, setUser] = useState<IUser | null>(null);

  useEffect(() => {
    let cancelled = false;
    userService.getCurrentUser().then(u => { if (!cancelled) setUser(u); });
    return () => { cancelled = true; };
  }, []);

  if (!user) return <p>Loading user…</p>;
  return (
    <div>
      <UserAvatar userId={user.id} size="lg" />
      <h1>{user.name}</h1>
    </div>
  );
}
