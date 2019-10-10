import './components/nodeDefsSelectorView.scss'

import React, { useState } from 'react'
import { connect } from 'react-redux'
import * as R from 'ramda'

import { useI18n } from '../../../commonComponents/hooks'

import EntitySelector from './components/entitySelector'
import AttributesSelector from './components/attributesSelector'

import Survey from '../../../../common/survey/survey'
import NodeDef from '../../../../common/survey/nodeDef'
import * as NodeDefUiProps from '../surveyForm/nodeDefs/nodeDefUIProps'

import * as SurveyState from '../../../survey/surveyState'

const NodeDefsSelectorView = props => {

  const {
    nodeDefUuidsAttributes, nodeDefUuidEntity,
    onChangeAttributes, onChangeEntity
  } = props

  const [filterTypes, setFilterTypes] = useState([])
  const [showSettings, setShowSettings] = useState(false)

  const onToggleAttribute = nodeDefUuid => {
    const idx = R.findIndex(R.equals(nodeDefUuid), nodeDefUuidsAttributes)
    const isDeleted = idx >= 0
    const fn = isDeleted ? R.remove(idx, 1) : R.append(nodeDefUuid)

    const newNodeDefUuidsAttributes = fn(nodeDefUuidsAttributes)
    onChangeAttributes(newNodeDefUuidsAttributes, nodeDefUuid, isDeleted)
  }

  const {
    surveyInfo,
    hierarchy,
    canSelectAttributes, showAncestors, showMultipleAttributes,
  } = props

  const i18n = useI18n()
  const lang = Survey.getLanguage(i18n.lang)(surveyInfo)

  return (
    <div className="node-defs-selector">
      <div className="node-defs-selector__container">

        <button className="btn btn-s btn-toggle-settings"
                aria-disabled={R.isNil(nodeDefUuidEntity)}
                onClick={() => setShowSettings(!showSettings)}>
          <span className="icon icon-cog icon-12px"/>
        </button>

        <EntitySelector
          hierarchy={hierarchy}
          lang={lang}
          nodeDefUuidEntity={nodeDefUuidEntity}
          onChange={onChangeEntity}
        />

        {
          showSettings &&
          <div className="node-defs-selector__settings">
            {
              R.keys(NodeDef.nodeDefType).map(type =>
                NodeDef.nodeDefType.entity !== type
                  ? <button key={type}
                            className={`btn btn-s btn-node-def-type${R.includes(type, filterTypes) ? ' active' : ''}`}
                            onClick={() => {
                              const idx = R.findIndex(R.equals(type), filterTypes)
                              const fn = idx >= 0 ? R.remove(idx, 1) : R.append(type)
                              setFilterTypes(fn(filterTypes))
                            }}>
                    {NodeDefUiProps.getIconByType(type)} {i18n.t(type)}</button>
                  : null
              )
            }
          </div>
        }

        <AttributesSelector
          lang={lang}
          nodeDefUuidEntity={nodeDefUuidEntity}
          nodeDefUuidsAttributes={nodeDefUuidsAttributes}
          onToggleAttribute={onToggleAttribute}
          filterTypes={filterTypes}
          canSelectAttributes={canSelectAttributes}
          showAncestors={showAncestors}
          showMultipleAttributes={showMultipleAttributes}
        />


      </div>
    </div>
  )
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
  const surveyInfo = Survey.getSurveyInfo(survey)

  return {
    surveyInfo,
    hierarchy: props.hierarchy || Survey.getHierarchy()(survey),
  }
}

export default connect(mapStateToProps)(NodeDefsSelectorView)