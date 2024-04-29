import React, { useMemo } from 'react'
import PropTypes from 'prop-types'

import { useI18n } from '@webapp/store/system'
import { FileUtils } from '@webapp/utils/fileUtils'
import { TooltipNew } from '@webapp/components/TooltipNew'

export const TableCellFiles = (props) => {
  const { item } = props

  const i18n = useI18n()

  const { filesCount, filesMissing, filesSize } = item

  const title = useMemo(() => {
    const filesSizeFormatted = FileUtils.toHumanReadableFileSize(filesSize)
    return i18n.t('files.totalSize', { size: filesSizeFormatted })
  }, [filesSize, i18n])

  if (!filesCount && !filesMissing) {
    return <span>0</span>
  }
  return (
    <>
      <TooltipNew title={title}>{filesCount}</TooltipNew>
      {filesMissing > 0 && (
        <TooltipNew title={i18n.t('files.missing', { count: filesMissing })}>
          <span className="icon icon-warning icon-12px icon-left" />
        </TooltipNew>
      )}
    </>
  )
}

TableCellFiles.propTypes = {
  item: PropTypes.object.isRequired,
}
