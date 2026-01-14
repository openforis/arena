import React from 'react'

import { ExportFileNameGenerator } from '@common/dataExport/exportFileNameGenerator'
import { ButtonDownload } from '@webapp/components'

import { FileFormats } from '@core/fileFormats'

export const TableHeaderLeft = () => {
  const fileName = ExportFileNameGenerator.generate({
    itemName: 'user_access_requests',
    includeTimestamp: true,
    fileFormat: FileFormats.xlsx,
  })
  return <ButtonDownload fileName={fileName} label="common.exportAll" href="/api/users/users-access-request/export" />
}
