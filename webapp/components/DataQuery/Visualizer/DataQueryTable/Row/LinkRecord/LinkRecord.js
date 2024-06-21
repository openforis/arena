import React from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'

import * as Record from '@core/record/record'
import { appModuleUri, dataModules } from '@webapp/app/appModules'
import { useI18n } from '@webapp/store/system'

const LinkRecord = (props) => {
  const { rowNo, row } = props

  const i18n = useI18n()

  const { parentUuid, record } = row

  const recordUuid = Record.getUuid(record)
  const recordEditUrl = `${appModuleUri(dataModules.record)}${recordUuid}?pageNodeUuid=${parentUuid}`

  return (
    <Link type="button" className="btn-transparent" title={i18n.t('dataExplorerView.editRecord')} to={recordEditUrl}>
      {rowNo}
      <span className="icon icon-link icon-right icon-12px" />
    </Link>
  )
}

LinkRecord.propTypes = {
  rowNo: PropTypes.number.isRequired,
  row: PropTypes.object.isRequired,
}

export default LinkRecord
