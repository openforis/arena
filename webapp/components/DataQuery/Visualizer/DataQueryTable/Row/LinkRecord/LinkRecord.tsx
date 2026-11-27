import { Link } from 'react-router'

import * as Record from '@core/record/record'
import { appModuleUri, dataModules } from '@webapp/app/appModules'
import { AppIcon } from '@webapp/components/AppIcon'
import { useI18n } from '@webapp/store/system'

type LinkRecordProps = {
  rowNo: number | string
  row: Record<string, any>
}

const LinkRecord = (props: LinkRecordProps) => {
  const { rowNo, row } = props

  const i18n = useI18n()

  const { parentUuid, record } = row

  const recordUuid = Record.getUuid(record)
  const recordEditUrl = `${appModuleUri(dataModules.record)}${recordUuid}?pageNodeUuid=${parentUuid}`

  return (
    <Link type="button" className="btn-transparent" title={i18n.t('dataExplorerView.editRecord')} to={recordEditUrl}>
      {rowNo}
      <AppIcon name="link" size={14} className="icon-right" />
    </Link>
  )
}

export default LinkRecord
