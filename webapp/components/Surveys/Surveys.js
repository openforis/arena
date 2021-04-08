import React from 'react'
import PropTypes from 'prop-types'
import { useDispatch } from 'react-redux'
import { useHistory } from 'react-router'

import * as Survey from '@core/survey/survey'
import * as Authorizer from '@core/auth/authorizer'
import { appModuleUri, homeModules } from '@webapp/app/appModules'

import { useOnUpdate } from '@webapp/components/hooks'
import { SurveyActions, useSurveyInfo } from '@webapp/store/survey'
import { useUser } from '@webapp/store/user'

import Table from '@webapp/components/Table'

import HeaderLeft from './HeaderLeft'
import RowHeader from './RowHeader'
import Row from './Row'

const Surveys = (props) => {
  const { module, moduleApiUri, title } = props

  const dispatch = useDispatch()
  const history = useHistory()
  const user = useUser()
  const surveyInfo = useSurveyInfo()

  // Redirect to dashboard on survey change
  useOnUpdate(() => {
    history.push(appModuleUri(homeModules.dashboard))
  }, [Survey.getUuid(surveyInfo)])

  const onRowClick = (surveyRow) => {
    const canEdit = Authorizer.canEditSurvey(user, surveyRow)
    dispatch(SurveyActions.setActiveSurvey(Survey.getId(surveyRow), canEdit))
  }

  const isRowActive = (surveyRow) => Survey.getId(surveyRow) === Survey.getIdSurveyInfo(surveyInfo)

  return (
    <Table
      module={module}
      moduleApiUri={moduleApiUri}
      gridTemplateColumns="50px repeat(6, 1.5fr)"
      headerLeftComponent={() => HeaderLeft({ title })}
      rowHeaderComponent={RowHeader}
      rowComponent={Row}
      onRowClick={onRowClick}
      isRowActive={isRowActive}
    />
  )
}

Surveys.propTypes = {
  module: PropTypes.string.isRequired,
  moduleApiUri: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
}

export { Surveys }
