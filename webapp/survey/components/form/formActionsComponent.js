import React from 'react'
import { connect } from 'react-redux'

import { nodeDefType } from '../../../../common/survey/nodeDef'
import { createNodeDef } from '../../nodeDefActions'

class FormActionsComponent extends React.Component {

  createNodeDef (type, props) {
    const {nodeDef, createNodeDef} = this.props
    createNodeDef(nodeDef.id, type, props)
  }

  createAttribute () {
    this.createNodeDef(nodeDefType.attribute, {})
  }

  createEntity () {
    // this.createNodeDef(nodeDefType.entity, {})
  }

  render () {
    return (
      <div style={{
        display: 'grid',
        gridTemplateRows: '.2fr .8fr',
      }}>
        <div style={{
          gridRow: '2',
          display: 'grid',
          gridRowGap: '1.5rem',
          alignContent: 'start',
        }}>

          <button className="btn btn-of-light"
                  onClick={() => this.createAttribute()}>
            Add Attribute
          </button>

          <button className="btn btn-of-light"
                  onClick={() => this.createEntity()}>
            Add Entity
          </button>
          <button className="btn btn-of-light">
            Add Entity New Page
          </button>
        </div>
      </div>
    )
  }

}

export default connect(null, {createNodeDef})(FormActionsComponent)