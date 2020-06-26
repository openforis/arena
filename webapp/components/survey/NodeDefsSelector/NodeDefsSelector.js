import './NodeDefsSelector.scss'
import React, { useState } from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import * as A from '@core/arena'
import { useI18n } from '@webapp/store/system'
import { useSurvey, useSurveyLang } from '@webapp/store/survey'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefUiProps from '@webapp/loggedin/surveyViews/surveyForm/nodeDefs/nodeDefUIProps'

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
  const [showFilter, setShowFilter] = useState(false)

  const onToggleAttribute = (nodeDefUuid) => {
    const attributeDefUuidsUpdated = nodeDefUuidsAttributes.includes(nodeDefUuid)
      ? nodeDefUuidsAttributes.filter((_nodeDefUuid) => _nodeDefUuid !== nodeDefUuid)
      : [...nodeDefUuidsAttributes, nodeDefUuid]
    onChangeAttributes(attributeDefUuidsUpdated)
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
        className={classNames('btn', 'btn-s', 'btn-toggle-filter', { highlight: showFilter || filterTypes.length > 0 })}
        aria-disabled={A.isEmpty(nodeDefUuidEntity)}
        onClick={() => setShowFilter(!showFilter)}
      >
        <span className="icon icon-filter icon-12px" />
      </button>

      {showFilter && (
        <div className="node-defs-selector__settings">
          {Object.keys(NodeDef.nodeDefType).map((type) =>
            NodeDef.nodeDefType.entity !== type ? (
              <button
                type="button"
                key={type}
                className={classNames('btn', 'btn-s', 'btn-node-def-type', 'deselectable', {
                  active: filterTypes.includes(type),
                })}
                onClick={() => {
                  const filterTypesUpdated = filterTypes.includes(type)
                    ? filterTypes.filter((_type) => _type !== type)
                    : [...filterTypes, type]
                  setFilterTypes(filterTypesUpdated)
                }}
              >
                <span>{i18n.t(type)}</span>
                {NodeDefUiProps.getIconByType(type)}
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
