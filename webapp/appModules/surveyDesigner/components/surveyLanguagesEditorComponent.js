import React from 'react'
import {connect} from 'react-redux'

import FormInputChipsComponent from '../../../commonComponents/formInputChipsComponent'

import { getCurrentSurvey } from '../../../survey/surveyState'
import { updateSurveyProp } from '../../../survey/actions'
import { getLanguageLabel, languages } from '../../../../common/app/languages'
import { getSurveyLanguages } from '../../../../common/survey/survey'

class SurveyLanguagesEditorComponent extends React.Component {

  onLanguagesChange (items) {
    let newLanguages = items.map(i => i.key)
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
                               onChange={(selectedItems) => this.onLanguagesChange(selectedItems)}/>
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



