import React from 'react'
import PropTypes from 'prop-types'

import { FileFormats } from '@core/fileFormats'

import { ButtonDownload } from './ButtonDownload'
import { ButtonMenu } from './ButtonMenu'

const labelByFileFormat = {
  [FileFormats.csv]: 'common.exportToCSV',
  [FileFormats.xlsx]: 'common.exportToExcel',
}

const exportFormats = [FileFormats.xlsx, FileFormats.csv]

export const ButtonMenuExport = (props) => {
  const { label = 'common.export', onClick: onClickProp, variant = 'outlined' } = props

  const items = exportFormats.map((fileFormat) => ({
    key: fileFormat,
    content: (
      <ButtonDownload
        label={labelByFileFormat[fileFormat]}
        onClick={() => onClickProp({ fileFormat })}
        variant="text"
      />
    ),
  }))
  return (
    <ButtonMenu
      className="btn-menu-advanced"
      iconClassName="icon-download2 icon-14px"
      label={label}
      items={items}
      variant={variant}
    />
  )
}

ButtonMenuExport.propTypes = {
  label: PropTypes.string,
  onClick: PropTypes.func.isRequired,
  variant: PropTypes.string,
}
