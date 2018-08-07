import React from 'react'
import { connect } from 'react-redux'
import * as R from 'ramda'

import { nodeDefType } from '../../../../common/survey/nodeDef'
import { createNodeDef } from '../../nodeDef/actions'
import { getNodeDefIconByType } from '../../nodeDef/components/nodeDefSystemProps'

class FormActions extends React.Component {
  constructor () {
    super()
    this.state = {opened: true}
  }

  toggleOpen () {
    const {opened} = this.state

    const width = opened ? 33 : 200
    document.getElementsByClassName('survey-form')[0].style.gridTemplateColumns = `1fr ${width}px`

    this.setState({opened: !opened})

    //react-grid-layout re-render
    window.dispatchEvent(new Event('resize'))
  }

  createNodeDef (type, props) {
    const {nodeDef, createNodeDef} = this.props
    createNodeDef(nodeDef.id, type, props)
  }

  addNodeDef (type) {
    this.createNodeDef(type, {})
  }

  createEntityNewPage () {
    // this.createNodeDef(nodeDefType.entity, {})
  }

  render () {
    return (
      <div className="survey-form__actions node-def__form_root">

        <div style={{opacity: '0.5', position: 'absolute'}}>
          <a className="btn btn-s btn-of-light-xs no-border"
             onClick={() => this.toggleOpen()}>
            <span className={`icon icon-${this.state.opened ? 'shrink2' : 'enlarge2'} icon-16px`}/>
          </a>
        </div>

        {
          this.state.opened ?
            <React.Fragment>
              <div/>
              <div/>
              <div/>
              <div className="title-of">
                <span className="icon icon-plus icon-left"></span> Add
              </div>

              {
                R.values(nodeDefType).map(type => <React.Fragment key={type}>
                    {
                      type === nodeDefType.entity ?
                        <div className="separator-of"></div>
                        : null

                    }
                    <button className="btn btn-s btn-of-light-s"
                            onClick={() => this.addNodeDef(type)}>
                      {getNodeDefIconByType(type)}{type}
                    </button>
                  </React.Fragment>
                )
              }

              <button className="btn btn-s btn-of-light-xs">
                <span className="icon icon-insert-template icon-left"></span>
                Entity New Page
              </button>
            </React.Fragment>
            : null
        }

      </div>

    )
  }

}

export default connect(null, {createNodeDef})(FormActions)