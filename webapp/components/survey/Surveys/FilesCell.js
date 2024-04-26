import React, { useMemo } from 'react'
import PropTypes from 'prop-types'

import { useI18n } from '@webapp/store/system'
import { FileUtils } from '@webapp/utils/fileUtils'
import { TooltipNew } from '@webapp/components/TooltipNew'

export const FilesCell = (props) => {
  const { item } = props

  const i18n = useI18n()

  const { filesCount, filesMissing, filesSize } = item

  const filesSizeFormatted = FileUtils.toHumanReadableFileSize(filesSize)

  const titleParts = useMemo(() => {
    const parts = []
    if (filesCount > 0) {
      parts.push(i18n.t('surveysView.filesTotal', { count: filesCount }))
    }
    if (filesMissing > 0) {
      parts.push(i18n.t('surveysView.filesMissing', { count: filesMissing }))
    }
    return parts
  }, [filesCount, filesMissing, i18n])

  return titleParts.length > 0 ? (
    <TooltipNew isTitleMarkdown title={titleParts.join('\n\n')}>
      {filesSizeFormatted}
    </TooltipNew>
  ) : (
    <span>{filesSizeFormatted}</span>
  )
}

FilesCell.propTypes = {
  item: PropTypes.object.isRequired,
}
