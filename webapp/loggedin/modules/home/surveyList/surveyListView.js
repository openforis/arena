import './surveyListView.scss'

import React, { useEffect } from 'react'
import { connect } from 'react-redux'
import * as R from 'ramda'

import Survey from '../../../../../common/survey/survey'
import Authorizer from '../../../../../common/auth/authorizer'

import TableView from '../../../tableViews/tableView'
import SurveyListHeaderLeft from './components/surveyListHeaderLeft'
import SurveyListRowHeader from './components/surveyListRowHeader'
import SurveyListRow from './components/surveyListRow'
import { useOnUpdate } from '../../../../commonComponents/hooks'

import * as AppState from '../../../../app/appState'
import * as SurveyListState from './surveyListState'
import * as SurveyState from '../../../../survey/surveyState'
import { appModuleUri, homeModules } from '../../../appModules'

import { setActiveSurvey } from '../../../../survey/actions'

const SurveyListView = props => {

  const {
    user, surveyInfo, history,
    setActiveSurvey,
  } = props

  // redirect to dashboard on survey change
  useOnUpdate(() => {
    history.push(appModuleUri(homeModules.dashboard))
  }, [Survey.getUuid(surveyInfo)])

  const onRowClick = surveyRow => {
    const canEdit = Authorizer.canEditSurvey(user, surveyRow)
    setActiveSurvey(Survey.getId(surveyRow), canEdit)
  }

  return (
    <TableView
      module="surveys"
      gridTemplateColumns="repeat(5, 1.5fr) 1fr"
      headerLeftComponent={SurveyListHeaderLeft}
      rowHeaderComponent={SurveyListRowHeader}
      rowComponent={SurveyListRow}
      onRowClick={onRowClick}
      moduleApiUri="/api/surveys"
    />
  )

}

const mapStateToProps = state => ({
  user: AppState.getUser(state),
  surveyInfo: SurveyState.getSurveyInfo(state),
  surveys: SurveyListState.getSurveys(state),
})

export default connect(mapStateToProps, { setActiveSurvey })(SurveyListView)
