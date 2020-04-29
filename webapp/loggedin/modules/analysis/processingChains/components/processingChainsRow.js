import React from 'react'
import PropTypes from 'prop-types'

import * as ProcessingChain from '@common/analysis/processingChain'
import * as DateUtils from '@core/dateUtils'

import ProgressBar from '@webapp/commonComponents/progressBar'
import { useI18n } from '@webapp/commonComponents/hooks'
import ErrorBadge from '@webapp/commonComponents/errorBadge'

const statusComponent = {
  [ProcessingChain.statusExec.success]: <span className="icon icon-checkmark icon-10px" />,
  [ProcessingChain.statusExec.error]: <span className="icon icon-cross icon-10px" />,
  [ProcessingChain.statusExec.running]: (
    <ProgressBar className="running progress-bar-striped" progress={100} showText={false} />
  ),
}

const ProcessingChainsRow = (props) => {
  const { row: processingChainsListItem } = props
  const i18n = useI18n()

  const statusExec = ProcessingChain.getStatusExec(processingChainsListItem)

  return (
    <>
      <div className="chain-label">
        <div>{ProcessingChain.getLabel(i18n.lang)(processingChainsListItem)}</div>
        <ErrorBadge
          validation={ProcessingChain.getValidation(processingChainsListItem)}
          className="error-badge-inverse"
        />
      </div>
      <div>{DateUtils.getRelativeDate(i18n, ProcessingChain.getDateCreated(processingChainsListItem))}</div>
      <div>{DateUtils.getRelativeDate(i18n, ProcessingChain.getDateModified(processingChainsListItem))}</div>
      <div>{DateUtils.getRelativeDate(i18n, ProcessingChain.getDateExecuted(processingChainsListItem))}</div>
      <div className="column-draft">
        {ProcessingChain.isDraft(processingChainsListItem) && <span className="icon icon-wrench icon-14px" />}
      </div>
      <div className={`column-status ${statusExec}`}>{statusComponent[statusExec]}</div>
      <div>
        <span className="icon icon-12px icon-action icon-pencil2" />
      </div>
    </>
  )
}

ProcessingChainsRow.propTypes = {
  row: PropTypes.object.isRequired,
}

export default ProcessingChainsRow
