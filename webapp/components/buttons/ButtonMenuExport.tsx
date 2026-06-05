import React from 'react'
import classNames from 'classnames'

import { FileFormats } from '@core/fileFormats'

import { ButtonDownload } from './ButtonDownload'
import { ButtonMenu } from './ButtonMenu'
import { useNotifyWarning } from '../hooks'

const labelByFileFormat: Record<string, string> = {
  [FileFormats.csv]: 'common.exportToCSV',
  [FileFormats.xlsx]: 'common.exportToExcel',
}

const exportFormats = [FileFormats.xlsx, FileFormats.csv]

type ButtonMenuExportProps = {
  className?: string | null
  excelExportDisabled?: boolean
  fileNameGenerator?: ((params: { fileFormat: string }) => string) | null
  href?: string | null
  label?: string
  onClick?: (params: { fileFormat: string }) => boolean | void | Promise<boolean | void>
  requestParams?: Record<string, unknown> | null
  testId?: string | null
  variant?: 'contained' | 'outlined' | 'text'
}

export const ButtonMenuExport = (props: ButtonMenuExportProps) => {
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
    let onClick: (() => boolean | void | Promise<boolean | void>) | undefined

    if (fileFormat === FileFormats.xlsx && excelExportDisabled) {
      onClick = () => {
        notifyWarning({ key: 'common.exportToExcelTooManyItems' })
        return false
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
          requestParams={href ? { ...requestParams, fileFormat } : null}
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
