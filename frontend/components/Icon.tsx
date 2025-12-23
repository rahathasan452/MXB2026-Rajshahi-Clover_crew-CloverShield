/**
 * Icon Component
 * Wrapper for Google Material Symbols icons
 */

import React from 'react'

interface IconProps {
  name: string
  size?: number | string
  className?: string
  filled?: boolean
}

export const Icon: React.FC<IconProps> = ({
  name,
  size = 24,
  className = '',
  filled = false,
}) => {
  const style: React.CSSProperties = {
    fontSize: typeof size === 'number' ? `${size}px` : size,
    fontVariationSettings: filled ? '"FILL" 1' : '"FILL" 0',
  }

  return (
    <span
      className={`material-symbols-outlined ${className}`}
      style={style}
    >
      {name}
    </span>
  )
}

