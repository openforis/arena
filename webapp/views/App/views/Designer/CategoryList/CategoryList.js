import React from 'react'
import PropTypes from 'prop-types'
import { useSelector } from 'react-redux'
import { matchPath, useLocation } from 'react-router'

import * as Survey from '@core/survey/survey'

import Table from '@webapp/components/Table'

import { appModuleUri, designerModules } from '@webapp/app/appModules'

import { SurveyState, CategoriesState } from '@webapp/store/survey'
import { useAuthCanEditSurvey } from '@webapp/store/user'

import TableRow from './TableRow'
import TableRowHeader from './TableRowHeader'
import TableHeaderLeft from './TableHeaderLeft'

const CategoryList = (props) => {
  const { canSelect, onSelect, selectedItemUuid } = props

  const { pathname } = useLocation()

  const inCategoriesPath = Boolean(matchPath(pathname, appModuleUri(designerModules.categories)))

  const survey = useSelector(SurveyState.getSurvey)
  const surveyId = Survey.getId(survey)
  const canEdit = useAuthCanEditSurvey()

  return (
    <>
      <Table
        module={CategoriesState.stateKey}
        moduleApiUri={`/api/survey/${surveyId}/categories`}
        restParams={{ draft: canEdit, validate: canEdit }}
        gridTemplateColumns=".05fr .7fr .05fr .05fr .05fr .05fr .05fr"
        headerLeftComponent={TableHeaderLeft}
        rowHeaderComponent={TableRowHeader}
        rowComponent={TableRow}
        headerProps={{ inCategoriesPath, onSelect }}
        rowProps={{ inCategoriesPath, surveyId, canSelect, onSelect, selectedItemUuid }}
      />
    </>
  )
}

CategoryList.propTypes = {
  canSelect: PropTypes.bool,
  onSelect: PropTypes.func,
  selectedItemUuid: PropTypes.string,
}

CategoryList.defaultProps = {
  canSelect: false,
  onSelect: null,
  selectedItemUuid: null,
}

export default CategoryList
