import React from 'react'
import PropTypes from 'prop-types'

import { Button } from '@webapp/components/buttons'

export const { DownloadButton: ButtonDownload } = (props) => {
  const { disabled, href, id, label, onClick, requestParams, showLabel, title, className } = props

  return (
    <Button
      className={`btn-s ${className}`}
      disabled={disabled}
      label={label}
      iconClassName="icon-download2 icon-14px"
      showLabel={showLabel}
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

ButtonDownload.propTypes = {
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

ButtonDownload.defaultProps = {
  className: '',
  disabled: false,
  href: null,
  id: null,
  label: 'common.download',
  onClick: null,
  requestParams: null,
  showLabel: true,
  title: null,
}
