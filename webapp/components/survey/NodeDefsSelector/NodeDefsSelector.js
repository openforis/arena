import './NodeDefsSelector.scss'
import React, { useState } from 'react'
import PropTypes from 'prop-types'
import * as R from 'ramda'

import { useI18n } from '@webapp/store/system'
import { useSurvey, useSurveyLang } from '@webapp/store/survey'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefUiProps from '../../../loggedin/surveyViews/surveyForm/nodeDefs/nodeDefUIProps'

import AttributesSelector from './AttributesSelector'
import EntitySelector from './EntitySelector'

const NodeDefsSelector = (props) => {
  const {
    nodeDefUuidsAttributes,
    nodeDefUuidEntity,
    hierarchy,
    canSelectAttributes,
    showAncestors,
    showMultipleAttributes,
    onChangeAttributes,
    onChangeEntity,
  } = props

  const i18n = useI18n()
  const survey = useSurvey()
  const lang = useSurveyLang()

  const [filterTypes, setFilterTypes] = useState([])
  const [showSettings, setShowSettings] = useState(false)

  const onToggleAttribute = (nodeDefUuid) => {
    const idx = R.findIndex(R.equals(nodeDefUuid), nodeDefUuidsAttributes)
    const isDeleted = idx >= 0
    const fn = isDeleted ? R.remove(idx, 1) : R.append(nodeDefUuid)

    const newNodeDefUuidsAttributes = fn(nodeDefUuidsAttributes)
    onChangeAttributes(newNodeDefUuidsAttributes, nodeDefUuid, isDeleted)
  }

  return (
    <div className="node-defs-selector">
      <EntitySelector
        hierarchy={hierarchy || Survey.getHierarchy()(survey)}
        lang={lang}
        nodeDefUuidEntity={nodeDefUuidEntity}
        onChange={onChangeEntity}
      />

      <button
        type="button"
        className="btn btn-s btn-toggle-settings"
        aria-disabled={R.isNil(nodeDefUuidEntity)}
        onClick={() => setShowSettings(!showSettings)}
      >
        <span className="icon icon-cog icon-12px" />
      </button>

      {showSettings && (
        <div className="node-defs-selector__settings">
          {R.keys(NodeDef.nodeDefType).map((type) =>
            NodeDef.nodeDefType.entity !== type ? (
              <button
                type="button"
                key={type}
                className={`btn btn-s btn-node-def-type${R.includes(type, filterTypes) ? ' active' : ''}`}
                onClick={() => {
                  const idx = R.findIndex(R.equals(type), filterTypes)
                  const fn = idx >= 0 ? R.remove(idx, 1) : R.append(type)
                  setFilterTypes(fn(filterTypes))
                }}
              >
                {NodeDefUiProps.getIconByType(type)} {i18n.t(type)}
              </button>
            ) : null
          )}
        </div>
      )}

      {nodeDefUuidEntity && (
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
      )}
    </div>
  )
}

NodeDefsSelector.propTypes = {
  nodeDefUuidEntity: PropTypes.string,
  nodeDefUuidsAttributes: PropTypes.arrayOf(String),
  hierarchy: PropTypes.object,
  canSelectAttributes: PropTypes.bool,
  showAncestors: PropTypes.bool,
  showMultipleAttributes: PropTypes.bool,
  onChangeAttributes: PropTypes.func,
  onChangeEntity: PropTypes.func,
}

NodeDefsSelector.defaultProps = {
  nodeDefUuidEntity: null,
  nodeDefUuidsAttributes: [],
  hierarchy: null,
  canSelectAttributes: true,
  showAncestors: true,
  showMultipleAttributes: true,
  onChangeEntity: () => {},
  onChangeAttributes: () => {},
}

export default NodeDefsSelector
