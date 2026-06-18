import type { UserAvatarProps } from '@gaev/user-contract';

const sizeMap = { sm: 32, md: 48, lg: 64 };

export default function UserAvatar({ userId, size = 'md' }: UserAvatarProps) {
  const px = sizeMap[size];
  return (
    <img
      src={`https://api.dicebear.com/7.x/personas/svg?seed=${userId}`}
      alt="avatar"
      width={px}
      height={px}
      style={{ borderRadius: '50%' }}
    />
  );
}
