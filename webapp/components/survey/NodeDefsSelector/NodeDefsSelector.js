import './NodeDefsSelector.scss'
import React, { useCallback, useState } from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import * as A from '@core/arena'
import { ArrayUtils } from '@core/arrayUtils'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

import * as NodeDefUIProps from '@webapp/components/survey/SurveyForm/nodeDefs/nodeDefUIProps'
import { ButtonIconFilter } from '@webapp/components/buttons'

import { useI18n } from '@webapp/store/system'
import { useSurvey, useSurveyPreferredLang } from '@webapp/store/survey'

import AttributesSelector from './AttributesSelector'
import EntitySelector from './EntitySelector'
import FilterByChain from './FilterByChain'

const NodeDefsSelector = (props) => {
  const {
    nodeDefUuidsAttributes,
    nodeDefUuidEntity,
    hierarchy,
    canSelectAttributes,
    showAnalysisAttributes,
    showAncestors,
    showMultipleAttributes,
    showSingleEntities,
    onChangeAttributes,
    onChangeEntity,
    nodeDefLabelType,
  } = props

  const i18n = useI18n()
  const survey = useSurvey()
  const lang = useSurveyPreferredLang()

  const [filterTypes, setFilterTypes] = useState([])
  const [filterChainUuids, setFilterChainUuids] = useState([])

  const [showFilter, setShowFilter] = useState(false)

  const onAttributesSelection = useCallback(
    ({ attributeDefUuids, selected }) => {
      const attributeDefUuidsUpdated = selected
        ? ArrayUtils.addItems({ items: attributeDefUuids })(nodeDefUuidsAttributes)
        : ArrayUtils.removeItems({ items: attributeDefUuids })(nodeDefUuidsAttributes)
      onChangeAttributes(attributeDefUuidsUpdated)
    },
    [nodeDefUuidsAttributes, onChangeAttributes]
  )

  const onToggleAttribute = useCallback(
    (nodeDefUuid) => {
      onAttributesSelection({
        attributeDefUuids: [nodeDefUuid],
        selected: !nodeDefUuidsAttributes.includes(nodeDefUuid),
      })
    },
    [nodeDefUuidsAttributes, onAttributesSelection]
  )

  return (
    <div className="node-defs-selector">
      <EntitySelector
        hierarchy={hierarchy || Survey.getHierarchy()(survey)}
        nodeDefUuidEntity={nodeDefUuidEntity}
        onChange={onChangeEntity}
        nodeDefLabelType={nodeDefLabelType}
        showSingleEntities={showSingleEntities}
      />

      <ButtonIconFilter
        className={classNames('btn-s', 'btn-toggle-filter', { highlight: showFilter || filterTypes.length > 0 })}
        disabled={A.isEmpty(nodeDefUuidEntity)}
        onClick={() => setShowFilter(!showFilter)}
        title="dataView.filterAttributeTypes"
        variant="outlined"
      />

      {showFilter && (
        <>
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
                  {NodeDefUIProps.getIconByType(type)}
                </button>
              ) : null
            )}
          </div>
          <FilterByChain filterChainUuids={filterChainUuids} setFilterChainUuids={setFilterChainUuids} />
        </>
      )}

      {nodeDefUuidEntity && (
        <AttributesSelector
          lang={lang}
          nodeDefUuidEntity={nodeDefUuidEntity}
          nodeDefUuidsAttributes={nodeDefUuidsAttributes}
          onAttributesSelection={onAttributesSelection}
          onToggleAttribute={onToggleAttribute}
          filterTypes={filterTypes}
          filterChainUuids={filterChainUuids}
          canSelectAttributes={canSelectAttributes}
          showAnalysisAttributes={showAnalysisAttributes}
          showAncestors={showAncestors}
          showMultipleAttributes={showMultipleAttributes}
          showSiblingsInSingleEntities
          nodeDefLabelType={nodeDefLabelType}
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
  showAnalysisAttributes: PropTypes.bool,
  showAncestors: PropTypes.bool,
  showMultipleAttributes: PropTypes.bool,
  showSingleEntities: PropTypes.bool,
  onChangeAttributes: PropTypes.func,
  onChangeEntity: PropTypes.func,
  nodeDefLabelType: PropTypes.string,
}

NodeDefsSelector.defaultProps = {
  nodeDefUuidEntity: null,
  nodeDefUuidsAttributes: [],
  hierarchy: null,
  canSelectAttributes: true,
  showAnalysisAttributes: false,
  showAncestors: true,
  showMultipleAttributes: true,
  showSingleEntities: false,
  onChangeEntity: () => {},
  onChangeAttributes: () => {},
  nodeDefLabelType: NodeDef.NodeDefLabelTypes.label,
}

export default NodeDefsSelector
