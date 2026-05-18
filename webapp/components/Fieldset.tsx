import React, { useMemo } from 'react'

import { useI18n } from '@webapp/store/system'
import { ButtonIconInfo } from './buttons'

type FieldsetProps = {
  children: React.ReactNode
  className?: string
  label?: string
  info?: string
  infoTitleClassName?: string
  infoTitleMarkdownClassName?: string
  infoTitleMaxWidth?: string
  isInfoMarkdown?: boolean
  onInfoClick?: ((event: any) => void) | null
}

export const Fieldset = (props: FieldsetProps) => {
  const {
    children,
    className,
    info,
    infoTitleClassName = undefined,
    infoTitleMarkdownClassName = undefined,
    infoTitleMaxWidth = undefined,
    isInfoMarkdown = false,
    label,
    onInfoClick = null,
  } = props
  const i18n = useI18n()

  const legendText = useMemo(() => (label ? i18n.t(label) : null), [i18n, label])

  return (
    <fieldset className={className}>
      <legend>
        {legendText}
        {info && (
          <ButtonIconInfo
            onClick={onInfoClick}
            title={info}
            isTitleMarkdown={isInfoMarkdown}
            titleClassName={infoTitleClassName}
            titleMarkdownClassName={infoTitleMarkdownClassName}
            titleMaxWidth={infoTitleMaxWidth}
          />
        )}
      </legend>
      {children}
    </fieldset>
  )
}
