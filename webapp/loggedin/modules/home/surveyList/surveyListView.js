import React from 'react'
import {connect} from 'react-redux'

import * as Survey from '@core/survey/survey'
import * as Authorizer from '@core/auth/authorizer'

import {useOnUpdate} from '@webapp/commonComponents/hooks'
import * as AppState from '@webapp/app/appState'
import * as SurveyState from '@webapp/survey/surveyState'
import {setActiveSurvey} from '@webapp/survey/actions'
import TableView from '../../../tableViews/tableView'
import {appModuleUri, homeModules} from '../../../appModules'
import SurveyListHeaderLeft from './components/surveyListHeaderLeft'
import SurveyListRowHeader from './components/surveyListRowHeader'
import SurveyListRow from './components/surveyListRow'

const SurveyListView = props => {
  const {
    user, surveyInfo, history,
    setActiveSurvey,
  } = props

  // Redirect to dashboard on survey change
  useOnUpdate(() => {
    history.push(appModuleUri(homeModules.dashboard))
  }, [Survey.getUuid(surveyInfo)])

  const onRowClick = surveyRow => {
    const canEdit = Authorizer.canEditSurvey(user, surveyRow)
    setActiveSurvey(Survey.getId(surveyRow), canEdit)
  }

  const isRowActive = surveyRow => Survey.getId(surveyRow) === Survey.getIdSurveyInfo(surveyInfo)

  return (
    <TableView
      module="surveys"
      moduleApiUri="/api/surveys"
      gridTemplateColumns="50px repeat(5, 1.5fr)"
      headerLeftComponent={SurveyListHeaderLeft}
      rowHeaderComponent={SurveyListRowHeader}
      rowComponent={SurveyListRow}
      onRowClick={onRowClick}
      isRowActive={isRowActive}
    />
  )
}

const mapStateToProps = state => ({
  user: AppState.getUser(state),
  surveyInfo: SurveyState.getSurveyInfo(state),
})

export default connect(mapStateToProps, {setActiveSurvey})(SurveyListView)
