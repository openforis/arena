import React from 'react'
import PropTypes from 'prop-types'

import * as Chain from '@common/analysis/chain'
import * as DateUtils from '@core/dateUtils'

import { useI18n } from '@webapp/store/system'
import { useSurveyPreferredLang } from '@webapp/store/survey'

import ProgressBar from '@webapp/components/progressBar'
import ErrorBadge from '@webapp/components/errorBadge'

const statusComponent = {
  [Chain.statusExec.success]: <span className="icon icon-checkmark icon-10px" />,
  [Chain.statusExec.error]: <span className="icon icon-cross icon-10px" />,
  [Chain.statusExec.running]: <ProgressBar className="running progress-bar-striped" progress={100} showText={false} />,
}

const Row = (props) => {
  const { row } = props
  const i18n = useI18n()
  const lang = useSurveyPreferredLang()

  const statusExec = Chain.getStatusExec(row)

  return (
    <>
      <div>
        <ErrorBadge validation={Chain.getValidation(row)} className="error-badge-inverse" showIcon showLabel={false} />
      </div>
      <div className="chain-label">
        <div>{Chain.getLabel(lang)(row)}</div>
      </div>
      <div>{DateUtils.getRelativeDate(i18n, Chain.getDateCreated(row))}</div>
      <div>{DateUtils.getRelativeDate(i18n, Chain.getDateModified(row))}</div>
      <div>{DateUtils.getRelativeDate(i18n, Chain.getDateExecuted(row))}</div>
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
