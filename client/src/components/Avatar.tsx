import { avatarColor, initials } from '../lib/utils';

interface AvatarProps {
  name: string;
  size?: 'sm' | 'md';
  online?: boolean;
}

export function Avatar({ name, size = 'md', online }: AvatarProps) {
  return (
    <span
      className={`avatar avatar-${size}`}
      style={{ background: avatarColor(name) }}
      title={name}
      aria-hidden="true"
    >
      {initials(name)}
      {online ? <span className="avatar-online" /> : null}
    </span>
  );
}
