import * as R from 'ramda'

import React from 'react'
import { connect } from 'react-redux'

import * as SurveyState from '../../survey/surveyState'

import Survey from '../../../common/survey/survey'

class SurveyHierarchy extends React.Component {

  componentDidMount () {
    const { root } = this.props

    const buildTree = node => ({
      name: R.path(['props', 'labels', 'en'], node) || R.path(['props', 'name'], node),
      children: node.children && node.children.map(child => buildTree(child))
    })

    console.log(root)
    console.log(buildTree(root))
  }

  render () {
    return (
      <div className="shopping-list">
        <h1>Test</h1>
      </div>
    )
  }
}


const mapStateToProps = state => {
  const survey = SurveyState.getSurvey(state)

  return {
    root: Survey.getHierarchy(() => true)(survey).root,
  }
}

export default connect(
  mapStateToProps
)(SurveyHierarchy)
