import React from 'react'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'

import { Input } from '../../commonComponents/form/input'
import LanguageDropdown from '../../commonComponents/form/languageDropdown'

import { appModuleUri, getSurveys } from '../../app/app'
import { appModules } from '../appModules'
import { normalizeName } from './../../../common/survey/surveyUtils'
import { getFieldValidation } from './../../../common/validation/validator'

import { getSurvey, getNewSurvey } from '../../survey/surveyState'

import { createSurvey, resetNewSurvey, updateNewSurveyProp } from '../../survey/actions'
import { fetchSurveys } from '../../app/actions'

class AppHomeView extends React.Component {

  createSurvey () {
    const {createSurvey, newSurvey} = this.props
    const {name, label, lang} = newSurvey

    createSurvey({
      name,
      label,
      lang
    })
  }

  componentDidMount () {
    this.props.fetchSurveys()
  }

  componentDidUpdate (prevProps) {

    const {currentSurvey: prevCurrentSurvey} = prevProps
    const {currentSurvey, history} = this.props

    if (currentSurvey && (!prevCurrentSurvey || currentSurvey.id !== prevCurrentSurvey.id)) {
      history.push(appModuleUri(appModules.surveyDashboard))
    }
  }

  componentWillUnmount () {
    this.props.resetNewSurvey()
  }

  render () {
    const {surveys, newSurvey, updateNewSurveyProp} = this.props

    const {name, label, lang, validation} = newSurvey

    return (
      <div style={{
        display: 'grid',
        gridTemplateColumns: '.1fr .8fr .1fr',
        gridTemplateRows: '.3fr .7fr',
      }}>

        <div style={{
          gridColumn: '2',

          display: 'grid',
          gridTemplateColumns: 'repeat(4, .25fr)',
          alignItems: 'center',
          gridColumnGap: '2rem',
        }}>
          <div>
            <Input placeholder="Name"
                   value={name}
                   validation={getFieldValidation('name')(validation)}
                   onChange={e => updateNewSurveyProp('name', normalizeName(e.target.value))}/>
          </div>
          <div>
            <Input placeholder="Label"
                   value={label}
                   validation={getFieldValidation('label')(validation)}
                   onChange={e => updateNewSurveyProp('label', e.target.value)}/>
          </div>
          <div>
            <LanguageDropdown placeholder="Language"
                              selection={lang}
                              onChange={e => updateNewSurveyProp('lang', e)}
                              validation={getFieldValidation('lang')(validation)}/>
          </div>
          <button className="btn btn-of-light"
                  onClick={() => this.createSurvey()}>
            <span className="icon icon-plus icon-left"></span>
            Create Survey
          </button>

        </div>
      </div>
    )
  }
}

AppHomeView.defaultProps = {
  newSurvey: null,
  currentSurvey: null,
  surveys: [],
}

const mapStateToProps = state => ({
  newSurvey: getNewSurvey(state),
  currentSurvey: getSurvey(state),
  surveys: getSurveys(state)
})

export default withRouter(connect(
  mapStateToProps,
  {
    createSurvey,
    updateNewSurveyProp,
    resetNewSurvey,
    fetchSurveys,
  }
)(AppHomeView))