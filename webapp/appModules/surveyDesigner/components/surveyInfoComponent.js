import React from 'react'
import { connect } from 'react-redux'
import { getCurrentSurvey } from '../../../survey/surveyState'
import { FormInput } from '../../../commonComponents/formInputComponents'
import LabelsEditorComponent from '../../../commonComponents/labelsEditorComponent'
import { updateSurveyProp } from '../../../survey/actions'

class SurveyInfoComponent extends React.Component {

  constructor (props) {
    super(props)

    this.onLabelsChange = this.onLabelsChange.bind(this)
    this.onNewLabelAdd = this.onNewLabelAdd.bind(this)
  }

  onLabelsChange(e) {
    const { survey, updateSurveyProp } = this.props
    const labels = survey.props.labels
    const newLabels = Object.assign({}, labels, {[e.lang]: e.label})

    updateSurveyProp(survey.id, {key: 'labels', value: newLabels})

    //do not wait for update to complete
    survey.props.labels = newLabels
    this.forceUpdate()
  }

  onNewLabelAdd(e) {
    const { survey, updateSurveyProp } = this.props
    const currentLanguages = survey.props.languages
    const {lang} = e
    const newLanguages = [...currentLanguages, lang]
    updateSurveyProp(survey.id, {key: 'languages', value: newLanguages})

    survey.props.languages = newLanguages
    this.onLabelsChange(e)
  }

  render () {
    const {survey} = this.props

    return (
      <div className="form">

        <div className="form-item">
          <label className="form-label">Name</label>
          <FormInput value={survey.props.name}/>

        </div>

        <div className="form-item">
          <label className="form-label">Label</label>
          <LabelsEditorComponent languages={survey.props.languages}
                                 labels={survey.props.labels}
                                 onChange={this.onLabelsChange}
                                 onNewLabelAdd={this.onNewLabelAdd}/>
        </div>

        <div className="form-item">
          <label className="form-label">das</label>
          <input className="form-input"></input>
        </div>

      </div>
    )
  }

}

const mapStateToProps = state => ({
  survey: getCurrentSurvey(state)
})

export default connect(
  mapStateToProps,
  {
    updateSurveyProp,
  }
)(SurveyInfoComponent)