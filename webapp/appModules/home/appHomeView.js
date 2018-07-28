import React from 'react'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import * as R from 'ramda'

import { normalizeName } from './../../../common/survey/survey'

import { createSurvey, resetNewSurvey, updateNewSurveyProp } from '../../survey/actions'
import { getCurrentSurvey, getNewSurvey } from '../../survey/surveyState'
import { appModules } from '../appModules'
import { appModuleUri } from '../../app/app'
import { FormInput } from '../../commonComponents/form'

class AppHomeView extends React.Component {

  constructor (props) {
    super(props)

    this.state = {}

    this.createSurvey = this.createSurvey.bind(this)
  }

  componentWillUnmount () {
    this.props.resetNewSurvey()
  }

  createSurvey () {
    const {createSurvey, newSurvey} = this.props
    const {name, label} = newSurvey

    createSurvey({name, label})
  }

  componentDidUpdate (prevProps) {

    const {currentSurvey: prevCurrentSurvey} = prevProps
    const {currentSurvey, history} = this.props

    if (currentSurvey && (!prevCurrentSurvey || currentSurvey.id !== prevCurrentSurvey.id)) {
      history.push(appModuleUri(appModules.surveyDashboard))
    }

  }

  render () {
    const {newSurvey, updateNewSurveyProp} = this.props

    const {name, label, validation = {}} = newSurvey

    return (
      <div style={{
        display: 'grid',
        gridTemplateColumns: '.2fr .6fr .2fr',
        gridTemplateRows: '.3fr .7fr',
      }}>

        <div style={{
          gridColumn: '2',

          display: 'grid',
          gridTemplateColumns: '.35fr .35fr .3fr',
          alignItems: 'center',
          gridColumnGap: '2rem',
        }}>

          <FormInput placeholder="Survey name"
                     value={name}
                     validation={R.path(['fields', 'name'])(validation)}
                     onChange={e => updateNewSurveyProp('name', normalizeName(e.target.value))}/>

          <FormInput placeholder="Survey Label"
                     value={label}
                     validation={R.path(['fields', 'label'])(validation)}
                     onChange={e => updateNewSurveyProp('label', e.target.value)}/>

          <button className="btn btn-of-light"
                  onClick={this.createSurvey}>
            <span className="icon icon-plus icon-left"></span>
            Create Survey
          </button>

        </div>
      </div>
    )
  }
}

AppHomeView.defaultProps = {
  newSurvey: {
    name: '',
    label: '',
  }
}

const mapStateToProps = state => ({
  newSurvey: getNewSurvey(state),
  currentSurvey: getCurrentSurvey(state),
})

export default withRouter(connect(
  mapStateToProps,
  {
    createSurvey,
    updateNewSurveyProp,
    resetNewSurvey,
  }
)(AppHomeView))