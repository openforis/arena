import React from 'react'
import classNames from 'classnames'
import PropTypes from 'prop-types'

import { FileFormats } from '@core/fileFormats'

import { ButtonDownload } from './ButtonDownload'
import { ButtonMenu } from './ButtonMenu'
import { useNotifyWarning } from '../hooks'

const labelByFileFormat = {
  [FileFormats.csv]: 'common.exportToCSV',
  [FileFormats.xlsx]: 'common.exportToExcel',
}

const exportFormats = [FileFormats.xlsx, FileFormats.csv]

export const ButtonMenuExport = (props) => {
  const {
    className = null,
    excelExportDisabled = false,
    fileNameGenerator = null,
    href = null,
    label = 'common.export',
    onClick: onClickProp,
    requestParams = null,
    testId = null,
    variant = 'outlined',
  } = props

  const notifyWarning = useNotifyWarning()

  const items = exportFormats.map((fileFormat) => {
    let onClick
    if (fileFormat === FileFormats.xlsx && excelExportDisabled) {
      onClick = () => {
        notifyWarning({ key: 'common.exportToExcelTooManyItems' })
        return false // Prevents the navigating to href
      }
    } else if (onClickProp) {
      onClick = () => onClickProp({ fileFormat })
    }

    return {
      key: fileFormat,
      content: (
        <ButtonDownload
          fileName={fileNameGenerator?.({ fileFormat })}
          label={labelByFileFormat[fileFormat]}
          href={href}
          onClick={onClick}
          requestParams={href ? { ...(requestParams ?? {}), fileFormat } : null}
          variant="text"
        />
      ),
    }
  })
  return (
    <ButtonMenu
      className={classNames('btn-menu-advanced', className)}
      iconClassName="icon-download2 icon-14px"
      label={label}
      items={items}
      testId={testId}
      variant={variant}
    />
  )
}

ButtonMenuExport.propTypes = {
  className: PropTypes.string,
  excelExportDisabled: PropTypes.bool,
  fileNameGenerator: PropTypes.func,
  href: PropTypes.string,
  label: PropTypes.string,
  onClick: PropTypes.func,
  requestParams: PropTypes.object,
  testId: PropTypes.string,
  variant: PropTypes.string,
}
