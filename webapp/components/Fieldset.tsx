import React, { useMemo } from 'react'
import { Dictionary } from '@openforis/arena-core'

import { useI18n } from '@webapp/store/system'
import { ButtonIconInfo } from './buttons'

type FieldsetProps = {
  children: React.ReactNode
  className?: string
  info?: string
  infoTitleClassName?: string
  infoTitleMarkdownClassName?: string
  infoTitleMaxWidth?: string
  isInfoMarkdown?: boolean
  legend?: string
  legendParams?: Dictionary<any>
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
    legend,
    legendParams,
    onInfoClick = null,
  } = props
  const i18n = useI18n()

  const legendText: string | null = useMemo(
    () => (legend ? (i18n.t(legend, legendParams) as string) : null),
    [i18n, legend, legendParams]
  )

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
