import React from 'react'
import { connect } from 'react-redux'
import { getCurrentSurvey } from '../../../survey/surveyState'
import { FormInput } from '../../../commonComponents/formInputComponents'

class SurveyInfoComponent extends React.Component {

  render () {
    const {survey} = this.props

    return (
      <div className="form">

        <div className="form-item">
          <label className="form-label">Name</label>
          <FormInput value={survey.props.name}/>

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

export default connect(mapStateToProps)(SurveyInfoComponent)