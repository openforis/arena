import React from 'react'

import { appState } from '../../app/app'
import { getDashboardComponentData } from './actions'
import { connect } from 'react-redux'

class DataFetchComponent extends React.Component {

  fetchData () {
    const {getDashboardComponentData, surveyId, module} = this.props
    getDashboardComponentData(surveyId, module)
  }

  componentDidMount () {
    this.fetchData()
  }

  constructor (props, type) {
    super(props)
    this.type = type
  }

  render () {
    const {children} = this.props
    return children
  }
}

export default connect(
  state => ({
    surveyId: appState.surveyId(state),
  }),
  {getDashboardComponentData}
)(DataFetchComponent)
