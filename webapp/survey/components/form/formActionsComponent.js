import React from 'react'
import { connect } from 'react-redux'
import * as R from 'ramda'

import { nodeDefType } from '../../../../common/survey/nodeDef'
import { createNodeDef } from '../../nodeDef/actions'

const nodeDefTypeIcons = {
  [nodeDefType.integer]: <span className="icon-left node_def__icon">923</span>,
  [nodeDefType.decimal]: <span className="icon-left node_def__icon">923,4</span>,
  [nodeDefType.string]: <span className="icon-left">{R.range(0, 3).map(i =>
    <span key={i} className="icon icon-text-color" style={{margin: '0 -3px'}}/>
  )}</span>,
  [nodeDefType.date]: <span className="icon icon-calendar icon-left"/>,
  [nodeDefType.time]: <span className="icon icon-clock icon-left"/>,
  [nodeDefType.boolean]: <span className="icon icon-radio-checked2 icon-left"/>,
  [nodeDefType.codeList]: <span className="icon icon-list icon-left"/>,
  [nodeDefType.coordinate]: <span className="icon icon-location2 icon-left"/>,
  [nodeDefType.taxon]: <span className="icon icon-leaf icon-left"/>,
  [nodeDefType.file]: <span className="icon icon-file-picture icon-left"/>,
  [nodeDefType.entity]: <span className="icon icon-table2 icon-left"/>,
}

class FormActionsComponent extends React.Component {
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
                      {nodeDefTypeIcons[type]}{type}
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

export default connect(null, {createNodeDef})(FormActionsComponent)