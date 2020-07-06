import React from 'react'
import PropTypes from 'prop-types'

import * as Survey from '@core/survey/survey'
import * as Taxonomy from '@core/survey/taxonomy'

import { useLang } from '@webapp/store/system'
import { useSurveyInfo } from '@webapp/store/survey'

const Row = (props) => {
  const { row: taxonomy } = props
  const surveyInfo = useSurveyInfo()
  const lang = useLang()

  const defaultLang = Survey.getDefaultLanguage(surveyInfo)

  return (
    <>
      <div>{Taxonomy.getName(taxonomy)}</div>
      <div>{Taxonomy.getDescription(lang, defaultLang)(taxonomy)}</div>

      <div />
      <div />
    </>
  )
}

Row.propTypes = {
  row: PropTypes.object.isRequired,
}

export default Row
