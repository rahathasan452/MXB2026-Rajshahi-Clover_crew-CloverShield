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
    fontVariationSettings: `'FILL' ${filled ? 1 : 0}, 'wght' 400, 'GRAD' 0, 'opsz' ${typeof size === 'number' ? size : 24}`,
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

