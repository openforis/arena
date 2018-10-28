import React from 'react'
import { connect } from 'react-redux'
import * as R from 'ramda'

import { Input } from '../../../commonComponents/form/input'
import InputChips from '../../../commonComponents/form/inputChips'
import LabelsEditorComponent from '../../../survey/components/labelsEditor'
import LanguagesEditorComponent from '../../../survey/components/languagesEditor'

import {
  getSurveyInfo,
  getSurveyName,
  getSurveyDescriptions,
  getSurveyLabels,
  getSurveySrs
} from '../../../../common/survey/survey'
import { getSrsName, srs } from '../../../../common/app/srs'

import { getSurvey } from '../../../survey/surveyState'
import { updateSurveyProp } from '../../../survey/surveyInfo/actions'

import { normalizeName } from './../../../../common/survey/surveyUtils'
import { getValidation, getFieldValidation } from './../../../../common/validation/validator'

class SurveyInfoComponent extends React.Component {

  updateSurveyProp (key, value) {
    this.props.updateSurveyProp(key, value)
  }

  onPropLabelsChange (item, key, currentValue) {
    this.updateSurveyProp(key, R.assoc(item.lang, item.label, currentValue))
  }

  render () {
    const {survey, surveyInfo} = this.props
    const validation = getValidation(surveyInfo)
    const surveySrs = getSurveySrs(survey).map(code => {return {key: code, value: getSrsName(code)}})

    return (
      <div className="form">

        <div className="form-item">
          <label className="form-label">Name</label>
          <Input value={getSurveyName(survey)}
                 validation={getFieldValidation('name')(validation)}
                 onChange={e => this.updateSurveyProp('name', normalizeName(e.target.value))}/>

        </div>

        <LanguagesEditorComponent/>

        <div className="form-item">
          <label className="form-label">SRS</label>
          <InputChips selection={surveySrs}
                      items={srs}
                      dropdownAutocompleteMinChars={3}
                      validation={getFieldValidation('srs')(validation)}
                      onChange={(items) => this.updateSurveyProp('srs', R.pluck('key')(items))}/>
        </div>

        <LabelsEditorComponent labels={getSurveyLabels(survey)}
                               onChange={(item) => this.onPropLabelsChange(item, 'labels', getSurveyLabels(survey))}/>

        <LabelsEditorComponent formLabel="Description(s)"
                               labels={getSurveyDescriptions(survey)}
                               onChange={(item) => this.onPropLabelsChange(item, 'descriptions', getSurveyDescriptions(survey))}/>

      </div>
    )
  }

}

const mapStateToProps = state => ({
  survey: getSurvey(state),
  surveyInfo: getSurveyInfo(getSurvey(state)),
})

export default connect(
  mapStateToProps,
  {
    updateSurveyProp,
  }
)(SurveyInfoComponent)