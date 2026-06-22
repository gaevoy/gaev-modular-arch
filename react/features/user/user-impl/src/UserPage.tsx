import UserAvatar from './UserAvatar';
import useCurrentUser from './useCurrentUser';

export default function UserPage() {
  const { user, loading } = useCurrentUser();

  if (loading || !user) return <p>Loading user…</p>;
  return (
    <div>
      <UserAvatar userId={user.id} size="lg" />
      <h1>{user.name}</h1>
    </div>
  );
}
