import './dataVisView.scss'

import React from 'react'
import { connect } from 'react-redux'

import { useOnUpdate } from '../../../../commonComponents/hooks'

import DataQueryView from './dataQuery/dataQueryView'

import { resetDataVis } from './actions'

import * as SurveyState from '../../../../survey/surveyState'

const DataVisView = props => {
  const { surveyCycleKey, resetDataVis } = props

  useOnUpdate(() => {
    resetDataVis()
  }, [surveyCycleKey])

  return (
    <div className="data-vis">

      <DataQueryView/>

    </div>
  )
}

const mapStateToProps = state => ({
  surveyCycleKey: SurveyState.getSurveyCycleKey(state),
})

export default connect(
  mapStateToProps,
  { resetDataVis }
)(DataVisView)