import React from 'react'
import { connect } from 'react-redux'
import axios from 'axios'
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

import { getSurvey } from '../../../survey/surveyState'
import { updateSurveyInfoProp } from '../../../survey/surveyInfo/actions'

import { normalizeName } from './../../../../common/survey/surveyUtils'
import { getValidation, getFieldValidation } from './../../../../common/validation/validator'

const SrsAutocomplete = props => {
  const {selection, validation, onChange} = props

  const itemsLookupFunction = async value => {
    const {data} = await axios.get('/api/srs/find', {
      params: {
        codeOrName: value
      }
    })
    return data.srss
  }

  return <InputChips itemsLookupFunction={itemsLookupFunction}
                     itemKeyProp="code"
                     itemLabelProp="name"
                     selection={selection}
                     dropdownAutocompleteMinChars={3}
                     validation={validation}
                     onChange={onChange}/>
}

class SurveyInfo extends React.Component {

  onPropLabelsChange (item, key, currentValue) {
    this.props.updateSurveyInfoProp(key, R.assoc(item.lang, item.label, currentValue))
  }

  render () {
    const {survey, surveyInfo, updateSurveyInfoProp} = this.props
    const surveySrs = getSurveySrs(surveyInfo)

    const validation = getValidation(surveyInfo)

    return (
      <div className="form">

        <div className="form-item">
          <label className="form-label">Name</label>
          <Input value={getSurveyName(survey)}
                 validation={getFieldValidation('name')(validation)}
                 onChange={e => updateSurveyInfoProp('name', normalizeName(e.target.value))}/>

        </div>

        <LanguagesEditorComponent/>

        <div className="form-item">
          <label className="form-label">SRS</label>
          <SrsAutocomplete selection={surveySrs}
                           validation={getFieldValidation('srs')}
                           onChange={srs => updateSurveyInfoProp('srs', srs)}/>
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
    updateSurveyInfoProp,
  }
)(SurveyInfo)