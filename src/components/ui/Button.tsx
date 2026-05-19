import React from 'react'
import { Icon } from './Icon'

type BtnKind = 'primary' | 'accent' | 'ghost' | 'danger' | 'icon' | ''
type BtnSize = 'sm' | ''

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  kind?: BtnKind
  size?: BtnSize
  icon?: string
  children?: React.ReactNode
}

export const Button: React.FC<ButtonProps> = ({ kind = '', size = '', icon, children, className = '', ...rest }) => {
  const cls = ['btn', kind && `btn--${kind}`, size && `btn--${size}`, className].filter(Boolean).join(' ')
  return (
    <button className={cls} {...rest}>
      {icon && <Icon name={icon} size={14} />}
      {children}
    </button>
  )
}
