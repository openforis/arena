import React from 'react'
import PropTypes from 'prop-types'

import * as ProcessingChain from '@common/analysis/processingChain'
import * as DateUtils from '@core/dateUtils'

import { useI18n } from '@webapp/commonComponents/hooks'
import ProgressBar from '@webapp/commonComponents/progressBar'
import ErrorBadge from '@webapp/commonComponents/errorBadge'

const statusComponent = {
  [ProcessingChain.statusExec.success]: <span className="icon icon-checkmark icon-10px" />,
  [ProcessingChain.statusExec.error]: <span className="icon icon-cross icon-10px" />,
  [ProcessingChain.statusExec.running]: (
    <ProgressBar className="running progress-bar-striped" progress={100} showText={false} />
  ),
}

const Row = (props) => {
  const { row } = props
  const i18n = useI18n()

  const statusExec = ProcessingChain.getStatusExec(row)

  return (
    <>
      <div className="chain-label">
        <div>{ProcessingChain.getLabel(i18n.lang)(row)}</div>
        <ErrorBadge validation={ProcessingChain.getValidation(row)} className="error-badge-inverse" />
      </div>
      <div>{DateUtils.getRelativeDate(i18n, ProcessingChain.getDateCreated(row))}</div>
      <div>{DateUtils.getRelativeDate(i18n, ProcessingChain.getDateModified(row))}</div>
      <div>{DateUtils.getRelativeDate(i18n, ProcessingChain.getDateExecuted(row))}</div>
      <div className="column-draft">
        {ProcessingChain.isDraft(row) && <span className="icon icon-wrench icon-14px" />}
      </div>
      <div className={`column-status ${statusExec}`}>{statusComponent[statusExec]}</div>
      <div>
        <span className="icon icon-12px icon-action icon-pencil2" />
      </div>
    </>
  )
}

Row.propTypes = {
  row: PropTypes.object.isRequired,
}

export default Row
