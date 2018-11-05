import React from 'react'
import { connect } from 'react-redux'
import * as R from 'ramda'

import { Input } from '../../../commonComponents/form/input'
import InputChips from '../../../commonComponents/form/inputChips'
import LabelsEditorComponent from '../../../survey/components/labelsEditor'
import LanguagesEditorComponent from '../../../survey/components/languagesEditor'

import {
  getSurveyInfo,
  getName,
  getDescriptions,
  getLabels,
  getSRS
} from '../../../../common/survey/survey'
import { getSrsName, srs } from '../../../../common/app/srs'

import { getSurvey } from '../../../survey/surveyState'
import { updateSurveyInfoProp } from '../../../survey/surveyInfo/actions'

import { normalizeName } from './../../../../common/survey/surveyUtils'
import { getValidation, getFieldValidation } from './../../../../common/validation/validator'

class SurveyInfo extends React.Component {

  updateSurveyProp (key, value) {
    this.props.updateSurveyProp(key, value)
  }

  onPropLabelsChange (item, key, currentValue) {
    this.updateSurveyProp(key, R.assoc(item.lang, item.label, currentValue))
  }

  render () {
    const {surveyInfo} = this.props
    const validation = getValidation(surveyInfo)
    const surveySrs = getSRS(surveyInfo).map(code => ({key: code, value: getSrsName(code)}))

    return (
      <div className="form">

        <div className="form-item">
          <label className="form-label">Name</label>
          <Input value={getName(surveyInfo)}
                 validation={getFieldValidation('name')(validation)}
                 onChange={e => this.updateSurveyProp('name', normalizeName(e.target.value))}/>

        </div>

        <LanguagesEditorComponent/>

        <div className="form-item">
          <label className="form-label">SRS</label>
          <InputChips items={srs}
                      selection={surveySrs}
                      dropdownAutocompleteMinChars={3}
                      validation={getFieldValidation('srs')(validation)}
                      onChange={(items) => this.updateSurveyProp('srs', R.pluck('key')(items))}/>
        </div>

        <LabelsEditorComponent labels={getLabels(surveyInfo)}
                               onChange={(item) => this.onPropLabelsChange(item, 'labels', getLabels(surveyInfo))}/>

        <LabelsEditorComponent formLabel="Description(s)"
                               labels={getDescriptions(surveyInfo)}
                               onChange={(item) => this.onPropLabelsChange(item, 'descriptions', getDescriptions(surveyInfo))}/>

      </div>
    )
  }

}

const mapStateToProps = state => ({
  surveyInfo: getSurveyInfo(getSurvey(state)),
})

export default connect(
  mapStateToProps,
  {
    updateSurveyProp: updateSurveyInfoProp,
  }
)(SurveyInfo)