import React from 'react'
import PropTypes from 'prop-types'

import { Button } from '@webapp/components/buttons'
import { useI18n } from '@webapp/store/system'

const DownloadButton = (props) => {
  const i18n = useI18n()

  const {
    disabled,
    href,
    id,
    label = i18n.t('common.download'),
    onClick,
    requestParams,
    showLabel,
    title,
    className,
  } = props

  return (
    <Button
      className={`btn-s ${className}`}
      disabled={disabled}
      label={showLabel && label}
      iconClassName="icon-download2 icon-14px"
      testId={id}
      title={title}
      onClick={async () => {
        if (href) {
          const queryParams = new URLSearchParams(requestParams)
          window.open(`${href}?${queryParams}`, '_blank')
        }
        if (onClick) {
          await onClick()
        }
      }}
    />
  )
}

DownloadButton.propTypes = {
  className: PropTypes.string,
  disabled: PropTypes.bool,
  id: PropTypes.string,
  href: PropTypes.string, // specify href, onClick or both
  label: PropTypes.string,
  onClick: PropTypes.func, // specify href, onClick or both
  requestParams: PropTypes.object,
  showLabel: PropTypes.bool,
  title: PropTypes.string,
}

DownloadButton.defaultProps = {
  className: '',
  disabled: false,
  href: null,
  id: null,
  label: undefined, // default to i18n.t('common.download')
  onClick: null,
  requestParams: null,
  showLabel: true,
  title: null,
}

export default DownloadButton
