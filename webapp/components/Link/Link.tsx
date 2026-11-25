import MuiLink from '@mui/material/Link'
import type React from 'react'

const isUrlSafe = (url) => url && (url.startsWith('http://') || url.startsWith('https://'))

type LinkProps = {
  children?: React.ReactNode
  disabled?: boolean
  href: string
  label?: string
}

export const Link = (props: LinkProps) => {
  const { children = null, disabled = false, href, label = undefined } = props
  // Validate href to prevent XSS attacks
  const hrefIsSafe = isUrlSafe(href)
  const safeHref = !disabled && hrefIsSafe ? href : undefined

  return (
    <MuiLink
      href={safeHref}
      target="_blank"
      rel="noopener noreferrer"
      aria-disabled={disabled ? 'true' : undefined}
      tabIndex={disabled ? -1 : undefined}
      onClick={(e) => {
        if (disabled) {
          e.preventDefault()
          e.stopPropagation()
        }
      }}
    >
      {children ?? label ?? href}
    </MuiLink>
  )
}
