import React from 'react'
import PropTypes from 'prop-types'

import * as Survey from '@core/survey/survey'
import * as Taxonomy from '@core/survey/taxonomy'

import ItemsColumn from '@webapp/loggedin/surveyViews/items/itemsColumn'

import { useI18n } from '@webapp/store/system'
import { useSurveyInfo } from '@webapp/store/survey'

const ColumnDescription = new ItemsColumn(
  'common.description',
  (props) => {
    const { item } = props
    const i18n = useI18n()
    const surveyInfo = useSurveyInfo()
    const defaultLang = Survey.getDefaultLanguage(surveyInfo)
    const descriptionDefaultLang = Taxonomy.getDescription(defaultLang)(item)

    return <>{Taxonomy.getDescription(i18n.lang, descriptionDefaultLang)(item)}</>
  },
  'description'
)

ColumnDescription.propTypes = {
  item: PropTypes.object.isRequired,
}

export default ColumnDescription
