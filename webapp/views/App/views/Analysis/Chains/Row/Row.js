import React from 'react'
import PropTypes from 'prop-types'

import * as Chain from '@common/analysis/chain'
import * as DateUtils from '@core/dateUtils'

import { useI18n } from '@webapp/store/system'
import { useSurveyPreferredLang } from '@webapp/store/survey'

import ErrorBadge from '@webapp/components/errorBadge'

const Row = (props) => {
  const { row } = props
  const i18n = useI18n()
  const lang = useSurveyPreferredLang()

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
