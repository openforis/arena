import './CategoryList.scss'

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

  const gridTemplateColumns = [
    '50px', // index
    '1fr', // name
    ...(canEdit ? ['repeat(2, 80px)'] : []), // select button
    ...(canSelect ? ['80px'] : []), // error and warning badges
    ...(canEdit ? ['repeat(2, 75px)'] : []), // edit and delete buttons
  ].join(' ')

  return (
    <>
      <Table
        module={CategoriesState.stateKey}
        moduleApiUri={`/api/survey/${surveyId}/categories`}
        restParams={{ draft: canEdit, validate: canEdit }}
        gridTemplateColumns={gridTemplateColumns}
        headerLeftComponent={TableHeaderLeft}
        rowHeaderComponent={TableRowHeader}
        rowComponent={TableRow}
        headerProps={{ inCategoriesPath, canEdit, canSelect, onSelect }}
        rowProps={{ inCategoriesPath, surveyId, canEdit, canSelect, onSelect, selectedItemUuid }}
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
