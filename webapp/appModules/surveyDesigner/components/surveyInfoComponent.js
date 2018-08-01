import React from 'react'
import { connect } from 'react-redux'

import * as R from 'ramda'

import { getSurveyLabels, getSurveyLanguages } from '../../../../common/survey/survey'
import { FormInput } from '../../../commonComponents/formInputComponents'
import FormLabelsEditorComponent from '../../../commonComponents/formLabelsEditorComponent'

import { getCurrentSurvey } from '../../../survey/surveyState'

import { updateSurveyProp } from '../../../survey/actions'

class SurveyInfoComponent extends React.Component {

  onLabelsChange (item) {
    const {survey, updateSurveyProp} = this.props

    updateSurveyProp(
      survey.id,
      'labels',
      R.assoc(item.lang, item.label, getSurveyLabels(survey))
    )
  }

  render () {
    const {survey} = this.props

    return (
      <div className="form">

        <div className="form-item">
          <label className="form-label">Name</label>
          <FormInput value={survey.props.name}
                     onChange={() => {}}/>

        </div>

        <FormLabelsEditorComponent languages={getSurveyLanguages(survey)}
                                   labels={getSurveyLabels(survey)}
                                   onChange={(item) => this.onLabelsChange(item)}/>

      </div>
    )
  }

}

SurveyInfoComponent.defaultProps = {
  survey: {},
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