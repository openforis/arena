import React from 'react'
import PropTypes from 'prop-types'

import { useI18n } from '@webapp/store/system'
import { FileUtils } from '@webapp/utils/fileUtils'
import { TooltipNew } from '@webapp/components/TooltipNew'

export const FilesCell = (props) => {
  const { item } = props

  const i18n = useI18n()

  const { filesCount, filesMissing, filesSize } = item

  const filesSizeFormatted = FileUtils.toHumanReadableFileSize(filesSize)
  const titleParts = []
  if (filesCount > 0) {
    titleParts.push(i18n.t('surveysView.filesTotal', { count: filesCount }))
  }
  if (filesMissing > 0) {
    titleParts.push(i18n.t('surveysView.filesMissing', { count: filesMissing }))
  }

  if (titleParts.length > 0) {
    const title = titleParts.join('\n\n')
    return (
      <TooltipNew isTitleMarkdown title={title}>
        {filesSizeFormatted}
      </TooltipNew>
    )
  } else {
    return <span>{filesSizeFormatted}</span>
  }
}

FilesCell.propTypes = {
  item: PropTypes.object.isRequired,
}
