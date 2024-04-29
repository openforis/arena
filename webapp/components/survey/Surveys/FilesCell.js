import React, { useMemo } from 'react'
import PropTypes from 'prop-types'

import { useI18n } from '@webapp/store/system'
import { FileUtils } from '@webapp/utils/fileUtils'
import { TooltipNew } from '@webapp/components/TooltipNew'

export const FilesCell = (props) => {
  const { item } = props

  const i18n = useI18n()

  const { filesCount, filesMissing, filesSize } = item

  const title = useMemo(() => {
    const filesSizeFormatted = FileUtils.toHumanReadableFileSize(filesSize)
    return i18n.t('surveysView.filesTotalSize', { size: filesSizeFormatted })
  }, [filesSize, i18n])

  if (filesCount === 0) {
    return <span>-</span>
  }
  return (
    <>
      <TooltipNew title={title}>{filesCount}</TooltipNew>
      {filesMissing > 0 && (
        <TooltipNew title={i18n.t('surveysView.filesMissing', { count: filesMissing })}>
          <span className="icon icon-warning icon-12px icon-left" />
        </TooltipNew>
      )}
    </>
  )
}

FilesCell.propTypes = {
  item: PropTypes.object.isRequired,
}
