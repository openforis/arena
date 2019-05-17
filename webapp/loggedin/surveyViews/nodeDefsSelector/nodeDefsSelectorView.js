import './components/nodeDefsSelectorView.scss'

import React from 'react'
import { connect } from 'react-redux'
import * as R from 'ramda'

import EntitySelector from './components/entitySelector'
import AttributesSelector from './components/attributesSelector'

import Survey from '../../../../common/survey/survey'
import NodeDef from '../../../../common/survey/nodeDef'
import * as NodeDefUiProps from '../surveyForm/nodeDefs/nodeDefSystemProps'

import * as SurveyState from '../../../survey/surveyState'

class NodeDefsSelectorView extends React.PureComponent {

  constructor (props) {
    super(props)

    this.state = {
      nodeDefUuidEntity: props.nodeDefUuidEntity,
      nodeDefUuidsAttributes: props.nodeDefUuidsAttributes,
      filterTypes: [],
      showSettings: false,
    }
  }

  onChangeEntity (nodeDefUuidEntity) {
    const nodeDefUuidsAttributes = []

    this.setState({ nodeDefUuidEntity, nodeDefUuidsAttributes })
    this.props.onChangeEntity(nodeDefUuidEntity)
    this.props.onChangeAttributes(nodeDefUuidsAttributes)
  }

  onToggleAttribute (nodeDefUuid) {
    const { nodeDefUuidsAttributes: nodeDefUuidsAttributesState } = this.state

    const idx = R.findIndex(R.equals(nodeDefUuid), nodeDefUuidsAttributesState)
    const isDeleted = idx >= 0
    const fn = isDeleted ? R.remove(idx, 1) : R.append(nodeDefUuid)
    const nodeDefUuidsAttributes = fn(nodeDefUuidsAttributesState)

    this.setState({ nodeDefUuidsAttributes })
    this.props.onChangeAttributes(nodeDefUuidsAttributes, nodeDefUuid, isDeleted)
  }

  componentDidUpdate (prevProps, prevState, snapshot) {
    const { nodeDefUuidEntity } = this.props
    const { nodeDefUuidEntity: nodeDefUuidEntityPrev } = prevProps
    if (nodeDefUuidEntity !== nodeDefUuidEntityPrev)
    // this.setState({ nodeDefUuidEntity })
      this.onChangeEntity(nodeDefUuidEntity)
  }

  render () {
    const {
      hierarchy, lang,
      canSelectAttributes, showAncestors, showMultipleAttributes,
    } = this.props

    const {
      nodeDefUuidEntity, nodeDefUuidsAttributes,
      showSettings, filterTypes
    } = this.state

    return (
      <div className="node-defs-selector">
        <div className="node-defs-selector__container">

          <button className="btn btn-s btn-of-light-xs btn-toggle-settings"
                  aria-disabled={R.isNil(nodeDefUuidEntity)}
                  onClick={() =>
                    this.setState(state => ({ showSettings: !state.showSettings }))
                  }>
            <span className="icon icon-cog icon-12px"/>
          </button>

          <EntitySelector
            hierarchy={hierarchy}
            lang={lang}
            nodeDefUuidEntity={nodeDefUuidEntity}
            onChange={this.onChangeEntity.bind(this)}
          />

          {
            showSettings &&
            <div className="node-defs-selector__settings">
              {
                R.keys(NodeDef.nodeDefType).map(type =>
                  NodeDef.nodeDefType.entity !== type
                    ? <button key={type}
                              className={`btn btn-s btn-of-light-s btn-node-def-type${R.includes(type, filterTypes) ? ' active' : ''}`}
                              onClick={() => {
                                const idx = R.findIndex(R.equals(type), filterTypes)
                                const fn = idx >= 0 ? R.remove(idx, 1) : R.append(type)
                                this.setState({ filterTypes: fn(filterTypes) })
                              }}>
                      {NodeDefUiProps.getNodeDefIconByType(type)} {type}</button>
                    : null
                )
              }
            </div>
          }

          <AttributesSelector
            lang={lang}
            nodeDefUuidEntity={nodeDefUuidEntity}
            nodeDefUuidsAttributes={nodeDefUuidsAttributes}
            onToggleAttribute={this.onToggleAttribute.bind(this)}
            filterTypes={filterTypes}
            canSelectAttributes={canSelectAttributes}
            showAncestors={showAncestors}
            showMultipleAttributes={showMultipleAttributes}
          />


        </div>
      </div>
    )
  }
}

NodeDefsSelectorView.defaultProps = {
  nodeDefUuidEntity: null,
  nodeDefUuidsAttributes: [],
  onChangeEntity: () => {},
  onChangeAttributes: () => {},

  canSelectAttributes: true,
  showAncestors: true,
  showMultipleAttributes: true,

  lang: null,
  hierarchy: null,
}

const mapStateToProps = (state, props) => {
  const survey = SurveyState.getSurvey(state)

  return {
    lang: Survey.getDefaultLanguage(Survey.getSurveyInfo(survey)),
    hierarchy: props.hierarchy || Survey.getHierarchy()(survey),
  }
}

export default connect(mapStateToProps)(NodeDefsSelectorView)

