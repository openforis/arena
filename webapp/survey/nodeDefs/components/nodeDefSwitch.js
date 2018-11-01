import React from 'react'
import { connect } from 'react-redux'
import * as R from 'ramda'

import {
  getNoColumns,
  nodeDefLayoutProps,
  getPageUUID,
} from '../../../../common/survey/nodeDefLayout'

import { getNodeDefLabel, isNodeDefRoot, isNodeDefMultiple, isNodeDefEntity } from '../../../../common/survey/nodeDef'
import { getNodeChildrenByDefId, getRootNode } from '../../../../common/record/record'

import { getSurvey} from '../../surveyState'
import { getSurveyDefaultLanguage } from '../../../../common/survey/survey'

import { setFormNodeDefEdit, setFormNodeDefUnlocked } from '../../form/actions'
import { isNodeDefFormLocked } from '../../form/surveyFormState'

import { putNodeDefProp, removeNodeDef } from '../actions'
import { getNodeDefComponent, getNodeDefDefaultValue } from './nodeDefSystemProps'


import { getRecord } from '../../record/recordState'
import { createNodePlaceholder, updateNode, removeNode } from '../../record/actions'



class NodeDefSwitch extends React.Component {

  checkNodePlaceholder () {
    const {entry, nodes, nodeDef, parentNode, createNodePlaceholder} = this.props

    if (entry && !isNodeDefEntity(nodeDef) && (R.isEmpty(nodes) || isNodeDefMultiple(nodeDef))) {
      const hasNotPlaceholder = R.pipe(
        R.find(R.propEq('placeholder', true)),
        R.isNil,
      )(nodes)

      if (hasNotPlaceholder && parentNode) {
        createNodePlaceholder(nodeDef, parentNode, getNodeDefDefaultValue(nodeDef))
      }
    }
  }

  componentDidMount () {
    const {nodeDef, edit} = this.props

    if (edit && !nodeDef.id)
      this.refs.nodeDefElem.scrollIntoView()

    this.checkNodePlaceholder()
  }

  componentDidUpdate () {
    this.checkNodePlaceholder()
  }

  render () {
    const {
      nodeDef,
      edit,
      locked,

      setFormNodeDefEdit,
      putNodeDefProp,
      setFormNodeDefUnlocked,
      removeNodeDef,
    } = this.props

    const isRoot = isNodeDefRoot(nodeDef)
    const invalid = nodeDef.validation && !nodeDef.validation.valid
    const isPage = !!getPageUUID(nodeDef)

    return <div className={`${isPage ? 'node-def__form_page' : 'node-def__form'}`} ref="nodeDefElem">
      {
        invalid ?
          <div className="node-def__form-error error-badge">
            <span className="icon icon-warning icon-16px icon-left"/>
            <span>INVALID</span>
          </div>
          : null
      }

      {
        edit ?
          <div className="node-def__form-actions">
            {
              locked ?
                null :
                <React.Fragment>
                  {
                    isPage ?
                      <div className="btn-of-light-xs node-def__form-root-actions">
                        columns
                        <input value={getNoColumns(nodeDef)}
                               type="number" min="1" max="6"
                               onChange={e => e.target.value > 0 ?
                                 putNodeDefProp(nodeDef, nodeDefLayoutProps.columns, e.target.value)
                                 : null
                               }/>
                      </div>
                      : null
                  }

                  <button className="btn-s btn-of-light-xs"
                          onClick={() => setFormNodeDefEdit(nodeDef)}>
                    <span className="icon icon-pencil2 icon-12px"/>
                  </button>

                  {
                    isRoot ?
                      null
                      : <button className="btn-s btn-of-light-xs"
                                aria-disabled={nodeDef.published}
                                onClick={() => {
                                  window.confirm('Are you sure you want to permanently delete this node definition? This operation cannot be undone')
                                    ? removeNodeDef(nodeDef)
                                    : null
                                }}>
                        <span className="icon icon-bin2 icon-12px"/>
                      </button>
                  }

                </React.Fragment>
            }

            <button className="btn-s btn-of-light-xs"
                    onClick={() => setFormNodeDefUnlocked(locked ? nodeDef : null)}>
              <span className={`icon icon-${locked ? 'lock' : 'unlocked'} icon-12px`}/>
            </button>

          </div>
          : null
      }

      {
        React.createElement(getNodeDefComponent(nodeDef), {...this.props})
      }

    </div>

  }
}

NodeDefSwitch.defaultProps = {
  locked: true,
}

const mapStateToProps = (state, props) => {
  const {nodeDef, parentNode, entry} = props
  const survey = getSurvey(state)

  const mapEntryProps = () => ({
    nodes: isNodeDefRoot(nodeDef)
      ? [getRootNode(getRecord(survey))]
      // : getNodeChildrenByDefId(parentNode, nodeDef.id)(getRecord(survey))
      : parentNode
        ? getNodeChildrenByDefId(parentNode, nodeDef.id)(getRecord(survey))
        : []
  })

  return {
    locked: isNodeDefFormLocked(nodeDef)(survey),
    label: getNodeDefLabel(nodeDef, getSurveyDefaultLanguage(survey)),
    ...entry ? mapEntryProps() : {},
  }
}

export default connect(
  mapStateToProps,
  {
    setFormNodeDefEdit, setFormNodeDefUnlocked,
    putNodeDefProp, removeNodeDef,
    updateNode, removeNode, createNodePlaceholder,
  }
)(NodeDefSwitch)