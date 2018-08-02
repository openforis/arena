import React from 'react'
import { connect } from 'react-redux'

import FormInputChipsComponent from '../../commonComponents/formInputChipsComponent'

import { getCurrentSurvey } from '../surveyState'
import { updateSurveyProp } from '../actions'
import { getLanguageLabel, languages } from '../../../common/app/languages'
import { getSurveyLanguages } from '../../../common/survey/survey'

class SurveyLanguagesEditorComponent extends React.Component {

  onLanguagesChange (items) {
    const newLanguages = items.map(i => i.key)
    this.props.updateSurveyProp('languages', newLanguages)
  }

  render () {
    const {survey} = this.props

    const surveyLanguages = getSurveyLanguages(survey)

    const selection = surveyLanguages.map(lang => ({key: lang, value: getLanguageLabel(lang)}))

    return <div className="form-item">
      <label className="form-label">Language(s)</label>
      <FormInputChipsComponent items={languages}
                               selection={selection}
                               onChange={(selectedItems) => this.onLanguagesChange(selectedItems)}
                               requiredItems={1}/>
    </div>
  }
}

const mapStateToProps = state => ({
  survey: getCurrentSurvey(state),
})

export default connect(
  mapStateToProps,
  {
    updateSurveyProp,
  }
)(SurveyLanguagesEditorComponent)



