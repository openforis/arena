import React from 'react'

import useI18n from '../useI18n'

const DownloadButton = props => {

  const i18n = useI18n()

  const {
    href, label = i18n.t('common.download'), title,
    className, showLabel, disabled
  } = props

  return (
    <a
      className={`btn btn-s ${className}`}
      aria-disabled={disabled}
      target="_blank"
      href={href}
      title={title}>
      <span className={`icon icon-download2 icon-14px${showLabel && label ? ' icon-left' : ''}`}/>
      {showLabel && label}
    </a>
  )
}

DownloadButton.defaultProps = {
  href: null,
  label: null,
  title: null,
  className: '',
  showLabel: true,
  disabled: false,
}

export default DownloadButton
