import './Row.scss'
import * as A from '@core/arena'
import React from 'react'
import PropTypes from 'prop-types'

import * as Survey from '@core/survey/survey'
import * as Taxonomy from '@core/survey/taxonomy'

import { useI18n, useLang } from '@webapp/store/system'
import { useSurvey, useSurveyInfo } from '@webapp/store/survey'
import ErrorBadge from '@webapp/components/errorBadge'
import WarningBadge from '@webapp/components/warningBadge'

const Row = (props) => {
  const { row: taxonomy } = props
  const survey = useSurvey()
  const surveyInfo = useSurveyInfo()
  const lang = useLang()
  const i18n = useI18n()

  const defaultLang = Survey.getDefaultLanguage(surveyInfo)

  /* open on click */
  return (
    <>
      <div>{Taxonomy.getName(taxonomy)}</div>
      <div>{Taxonomy.getDescription(lang, defaultLang)(taxonomy)}</div>
      <div>
        <ErrorBadge validation={taxonomy.validation} />
      </div>
      <div>
        <WarningBadge
          show={A.isEmpty(Survey.getNodeDefsByTaxonomyUuid(Taxonomy.getUuid(taxonomy))(survey))}
          label={i18n.t('itemsTable.unused')}
        />
      </div>
      <div /> {/* Edit */}
      <div /> {/* Delete */}
    </>
  )
}

Row.propTypes = {
  row: PropTypes.object.isRequired,
}

export default Row
