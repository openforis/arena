import React from 'react'
import { connect } from 'react-redux'

import * as R from 'ramda'

import {
  getSurveyDescriptions,
  getSurveyLabels,
  getSurveyLanguages,
  getSurveySrs
} from '../../../../common/survey/survey'
import { getSrsName, srs } from '../../../../common/app/srs'
import { FormInput } from '../../../commonComponents/formInputComponents'
import FormLabelsEditorComponent from '../../../commonComponents/formLabelsEditorComponent'
import FormInputChipsComponent from '../../../commonComponents/formInputChipsComponent'
import SurveyLanguagesEditorComponent from '../../../survey/components/surveyLanguagesEditorComponent'

import { getCurrentSurvey } from '../../../survey/surveyState'
import { updateSurveyProp } from '../../../survey/actions'

class SurveyInfoComponent extends React.Component {

  updateSurveyProp (key, value) {
    this.props.updateSurveyProp(key, value)
  }

  onPropLabelsChange (item, key, currentValue) {
    this.updateSurveyProp(key, R.assoc(item.lang, item.label, currentValue))
  }

  render () {
    const {survey} = this.props

    const surveySrs = getSurveySrs(survey).map(code => {return {key: code, value: getSrsName(code)}})

    return (
      <div className="form">

        <div className="form-item">
          <label className="form-label">Name</label>
          <FormInput value={survey.props.name}
                     onChange={e => this.updateSurveyProp('name', e.target.value)}/>

        </div>

        <SurveyLanguagesEditorComponent/>

        <div className="form-item">
          <label className="form-label">SRS</label>
          <FormInputChipsComponent selection={surveySrs}
                                   items={srs}
                                   onChange={(items) => this.updateSurveyProp('srs', R.pluck('key')(items))}/>
        </div>


        <FormLabelsEditorComponent languages={getSurveyLanguages(survey)}
                                   labels={getSurveyLabels(survey)}
                                   onChange={(item) => this.onPropLabelsChange(item, 'labels', getSurveyLabels(survey))}/>

        <FormLabelsEditorComponent formLabel="Description(s)"
                                   languages={getSurveyLanguages(survey)}
                                   labels={getSurveyDescriptions(survey)}
                                   onChange={(item) => this.onPropLabelsChange(item, 'descriptions', getSurveyDescriptions(survey))}/>

      </div>
    )
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
)(SurveyInfoComponent)