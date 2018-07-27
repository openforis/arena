import React from 'react'
import { connect } from 'react-redux'
import * as R from 'ramda'

import { normalizeName } from './../../../common/survey/survey'

import { createSurvey, updateNewSurveyProp } from '../../survey/actions'

const FormInput = ({type = 'input', value, placeholder, onChange, validation = {}}) => {
  const {valid = true} = validation

  return <input type={type}
                className={`form-input ${valid ? '' : ' error'}`}
                value={value}
                placeholder={placeholder}
                onChange={onChange}
  />
}

class AppHomeView extends React.Component {

  constructor (props) {
    super(props)

    // this.state = {name: '', label: ''}

    this.createSurvey = this.createSurvey.bind(this)
  }

  createSurvey () {
    const {createSurvey, newSurvey} = this.props
    const {name, label} = newSurvey

    createSurvey({name, label})
  }

  render () {
    const {newSurvey, updateNewSurveyProp} = this.props

    const {name, label, validation = {}} = newSurvey

    return (
      <div style={{
        display: 'grid',
        gridTemplateColumns: '.2fr .6fr .2fr',
        gridTemplateRows: '.3fr .7fr',
      }}>

        <div style={{
          gridColumn: '2',

          display: 'grid',
          gridTemplateColumns: '.35fr .35fr .3fr',
          alignItems: 'center',
          gridColumnGap: '2rem',
        }}>

          <FormInput placeholder="Survey name"
                     value={name}
                     validation={R.path(['fields', 'name'])(validation)}
                     onChange={e => updateNewSurveyProp('name', normalizeName(e.target.value))}/>

          <FormInput placeholder="Survey Label"
                     value={label}
                     validation={R.path(['fields', 'label'])(validation)}
                     onChange={e => updateNewSurveyProp('label', e.target.value)}/>

          <button className="btn btn-of-light"
                  onClick={this.createSurvey}>
            <span className="icon icon-plus icon-left"></span>
            Create Survey
          </button>

        </div>
      </div>
    )
  }
}

AppHomeView.defaultProps = {
  newSurvey: {
    name: '',
    label: '',
  }
}

const mapStateToProps = state => ({
  newSurvey: R.path(['survey', 'newSurvey'])(state)
})

export default connect(
  mapStateToProps,
  {createSurvey, updateNewSurveyProp}
)(AppHomeView)
