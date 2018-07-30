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

import Dropdown from '../../commonComponents/dropdown'
import languages from '../../../common/app/languages'

class AppHomeView extends React.Component {

  constructor (props) {
    super(props)

    this.state = {}

    this.createSurvey = this.createSurvey.bind(this)

    this.languages = R.pipe(
      R.keys,
      R.map(lang => ({key: lang, value: R.path([lang, 'en'], languages)}))
    )(languages)

  }

  componentWillUnmount () {
    this.props.resetNewSurvey()
  }

  createSurvey () {
    const {createSurvey, newSurvey} = this.props
    const {name, label, lang} = newSurvey

    createSurvey({
      name,
      label,
      lang
    })
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

    const {name, label, lang, validation} = newSurvey
    const selection = lang
      ? {key: lang, value: languages[lang].en}
      : null

    return (
      <div style={{
        display: 'grid',
        gridTemplateColumns: '.2fr .6fr .2fr',
        gridTemplateRows: '.3fr .7fr',
      }}>

        <div style={{
          gridColumn: '2',

          display: 'grid',
          gridTemplateColumns: 'repeat(4, .25fr)',
          alignItems: 'center',
          gridColumnGap: '2rem',
        }}>

          <FormInput placeholder="Name"
                     value={name}
                     validation={R.path(['fields', 'name'])(validation)}
                     onChange={e => updateNewSurveyProp('name', normalizeName(e.target.value))}/>

          <FormInput placeholder="Label"
                     value={label}
                     validation={R.path(['fields', 'label'])(validation)}
                     onChange={e => updateNewSurveyProp('label', e.target.value)}/>

          <Dropdown placeholder="Language"
                    items={this.languages}
                    selection={selection}
                    onChange={e => updateNewSurveyProp('lang', e ? e.key : null)}
                    validation={R.path(['fields', 'lang'])(validation)}/>

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