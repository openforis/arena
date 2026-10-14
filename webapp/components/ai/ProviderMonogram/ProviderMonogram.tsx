import './ProviderMonogram.scss'

import React from 'react'

import { getProviderMonogram } from './providerMonogram'

type Props = {
  type: string
  small?: boolean
}

/**
 * Coloured two-letter mark of a provider type (decorative: the name is always shown beside it).
 * @param {Props} props - Props.
 * @returns {React.ReactElement} The mark.
 */
export const ProviderMonogram = ({ type, small = false }: Props) => {
  const { text, tone } = getProviderMonogram(type)
  const sizeClass = small ? ' provider-monogram--small' : ''
  return (
    <span className={`provider-monogram provider-monogram--${tone}${sizeClass}`} aria-hidden="true">
      {text}
    </span>
  )
}
