import React from 'react'

interface AvatarProps {
  name: string
  idx?: number
  size?: 'lg' | 'xl' | ''
}

function initials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? '')
    .join('')
}

export const Avatar: React.FC<AvatarProps> = ({ name, idx = 0, size = '' }) => (
  <div className={`avatar av-${(idx ?? 0) % 6}${size ? ` avatar--${size}` : ''}`}>
    {initials(name)}
  </div>
)

interface NameCellProps {
  name: string
  sub?: string
  avatarIdx?: number
}

export const NameCell: React.FC<NameCellProps> = ({ name, sub, avatarIdx = 0 }) => (
  <div className="name-cell">
    <Avatar name={name} idx={avatarIdx} />
    <div className="name-cell__text">
      <div className="name-cell__name">{name}</div>
      {sub && <div className="name-cell__sub">{sub}</div>}
    </div>
  </div>
)
