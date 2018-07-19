import React from 'react'
import { connect } from 'react-redux'

import PageComponent from './pageComponent'

import { appState } from '../../app/app'

import { newEntityDef, newPageDef } from '../../appModules/surveyDesigner/components/formDesigner'

// import {
//   addRootEntity,
// } from '../../appModules/surveyDesigner/actions'
//
class FormRendererComponent extends React.Component {

  //simulate with state now
  constructor () {
    super()
    this.state = {
      pageDef: null,
      entityDef: null,
    }
  }

  addRootEntity () {
    this.setState({
      pageDef: newPageDef(),
      entityDef: newEntityDef(),
    })
  }

  render () {

    const {
      surveyId,
      entityDef,
      pageDef,
      // addRootEntity
    } = this.state

    console.log(this.state)
    return (
      entityDef
        ? (
          <PageComponent entityDef={entityDef}/>
        )
        : (
          <div style={{
            display: 'grid',
            justifyContent: 'center',
            marginTop: '3rem',
          }}>
            <button className="btn btn-of-light"
                    onClick={() => {
                      this.addRootEntity()
                    }}>
              Start
            </button>
          </div>
        )

    )
  }

}

FormRendererComponent.defaultProps = {
  surveyId: -1,
  //root entity
  entityDef: null,
  //root pageDef
  pageDef: null,
}

const mapStateToProps = state => ({
  surveyId: appState.getSurveyId(state)
})

export default connect(
  mapStateToProps,
  // {
  //   addRootEntity
  // }
)(FormRendererComponent)