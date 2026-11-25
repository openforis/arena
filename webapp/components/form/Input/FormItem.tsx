import classNames from 'classnames'
import type React from 'react'

import { Objects } from '@openforis/arena-core'

import { ButtonIconInfo } from '@webapp/components/buttons'
import { useIsMobile } from '@webapp/components/hooks/useIsMobile'
import { useI18n } from '@webapp/store/system'

const getLabel = ({ appendColonToLabel, labelProp, labelParams, i18n }) => {
  if (Objects.isNotEmpty(labelProp) && typeof labelProp === 'string') {
    const label = i18n.t(labelProp, { ...labelParams, interpolation: { escapeValue: false } })
    return appendColonToLabel && label ? `${label}:` : label
  } else {
    return labelProp
  }
}

type FormItemProps = {
  appendColonToLabel?: boolean
  className?: string
  children: string | number | React.ReactElement | React.ReactElement[]
  hideLabelInMobile?: boolean
  // id of the labelled input
  htmlFor?: string
  info?: string
  isInfoMarkdown?: boolean
  infoTitleClassName?: string
  infoTitleMarkdownClassName?: string
  infoTitleMaxWidth?: string | number
  label?: string | React.ReactElement
  labelParams?: Record<string, any>
  onInfoClick?: (...args: any[]) => any
  required?: boolean
}

export const FormItem = (props: FormItemProps) => {
  const {
    appendColonToLabel = false,
    children,
    className = '',
    hideLabelInMobile = false,
    info = null,
    infoTitleClassName = undefined,
    infoTitleMarkdownClassName = undefined,
    infoTitleMaxWidth = undefined,
    htmlFor = undefined,
    isInfoMarkdown = false,
    label: labelProp,
    labelParams,
    onInfoClick = null,
    required = false,
  } = props

  const i18n = useI18n()
  const label = getLabel({ appendColonToLabel, labelProp, labelParams, i18n })
  const isMobile = useIsMobile()

  // with htmlFor (the id of the input) the label names the input for assistive technology and a click focuses it
  const LabelWrapper = htmlFor ? 'label' : 'div'

  const labelComponent =
    !isMobile || !hideLabelInMobile ? (
      <div className="form-label">
        <LabelWrapper className="form-label-wrapper" htmlFor={htmlFor}>
          {label}
          {required ? ' *' : ''}
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
        </LabelWrapper>
      </div>
    ) : null

  return (
    <div className={classNames('form-item', { mobile: isMobile }, className)}>
      {labelComponent}
      {children}
    </div>
  )
}
