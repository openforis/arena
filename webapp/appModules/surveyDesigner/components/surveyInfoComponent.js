import React from 'react'
import { connect } from 'react-redux'

import * as R from 'ramda'

import { getSurveyLanguages, getSurveyLabels, getSurveyDescriptions } from '../../../../common/survey/survey'
import { FormInput } from '../../../commonComponents/formInputComponents'
import FormLabelsEditorComponent from '../../../commonComponents/formLabelsEditorComponent'

import { getCurrentSurvey } from '../../../survey/surveyState'

import { updateSurveyProp } from '../../../survey/actions'
import SurveyLanguagesEditorComponent from '../../../survey/components/surveyLanguagesEditorComponent'

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