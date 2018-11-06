import React from 'react'
import { connect } from 'react-redux'

import InputChips from '../../commonComponents/form/inputChips'

import Survey from '../../../common/survey/survey'

import { getStateSurveyInfo } from '../surveyState'
import { updateSurveyInfoProp } from '../surveyInfo/actions'
import { getLanguageLabel, languages } from '../../../common/app/languages'

class LanguagesEditor extends React.Component {

  onLanguagesChange (items) {
    const newLanguages = items.map(i => i.key)
    this.props.updateSurveyProp('languages', newLanguages)
  }

  render () {
    const {surveyInfo} = this.props

    const surveyLanguages = Survey.getLanguages(surveyInfo)

    const selection = surveyLanguages.map(lang => ({key: lang, value: getLanguageLabel(lang)}))

    return <div className="form-item">
      <label className="form-label">Language(s)</label>
      <InputChips items={languages}
                  itemKeyProp="key"
                  selection={selection}
                  onChange={(selectedItems) => this.onLanguagesChange(selectedItems)}
                  requiredItems={1}/>
    </div>
  }
}

const mapStateToProps = state => ({
  surveyInfo: getStateSurveyInfo(state),
})

export default connect(
  mapStateToProps,
  {
    updateSurveyProp: updateSurveyInfoProp,
  }
)(LanguagesEditor)



