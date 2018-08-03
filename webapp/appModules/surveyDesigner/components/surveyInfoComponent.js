import React from 'react'
import { connect } from 'react-redux'

import * as R from 'ramda'

import { getSurveyLabels, getSurveyDescriptions } from '../../../../common/survey/survey'
import { FormInput } from '../../../commonComponents/formInputComponents'
import FormLabelsEditorComponent from '../../../survey/components/labelsEditorComponent'

import { getCurrentSurvey } from '../../../survey/surveyState'

import { updateSurveyProp } from '../../../survey/actions'
import SurveyLanguagesEditorComponent from '../../../survey/components/languagesEditorComponent'

class SurveyInfoComponent extends React.Component {

  updateSurveyProp (key, value) {
    this.props.updateSurveyProp(key, value)
  }

  onPropLabelsChange (item, key, currentValue) {
    this.updateSurveyProp(key, R.assoc(item.lang, item.label, currentValue))
  }

  render () {
    const {survey} = this.props

    return (
      <div className="form">

        <div className="form-item">
          <label className="form-label">Name</label>
          <FormInput value={survey.props.name}
                     onChange={e => this.updateSurveyProp('name', e.target.value)}/>

        </div>

        <SurveyLanguagesEditorComponent/>

        <FormLabelsEditorComponent labels={getSurveyLabels(survey)}
                                   onChange={(item) => this.onPropLabelsChange(item, 'labels', getSurveyLabels(survey))}/>

        <FormLabelsEditorComponent formLabel="Description(s)"
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