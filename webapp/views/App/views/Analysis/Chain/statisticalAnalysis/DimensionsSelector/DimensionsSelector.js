import './DimensionsSelector.scss'

import React, { useCallback, useMemo } from 'react'
import PropTypes from 'prop-types'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

import { useSurvey, useSurveyCycleKey, useSurveyPreferredLang } from '@webapp/store/survey'
import * as NodeDefUIProps from '@webapp/components/survey/SurveyForm/nodeDefs/nodeDefUIProps'
import { Dropdown } from '@webapp/components/form'

export const DimensionsSelector = (props) => {
  const {
    chainUuid,
    disabled = false,
    entityDefUuid = null,
    labelType = NodeDef.NodeDefLabelTypes.name,
    onDimensionsChange,
    selectedDimensionsUuids = [],
    showAnalysisAttributes = false,
  } = props

  const cycle = useSurveyCycleKey()
  const survey = useSurvey()
  const lang = useSurveyPreferredLang()

  const entityDef = entityDefUuid ? Survey.getNodeDefByUuid(entityDefUuid)(survey) : null

  const isDimensionIncluded = useCallback(
    (nodeDef) =>
      NodeDef.isSingleAttribute(nodeDef) &&
      [NodeDef.nodeDefType.boolean, NodeDef.nodeDefType.code, NodeDef.nodeDefType.taxon].includes(
        NodeDef.getType(nodeDef)
      ) &&
      NodeDef.isInCycle(cycle)(nodeDef) &&
      (!chainUuid || !NodeDef.getChainUuid(nodeDef) || chainUuid === NodeDef.getChainUuid(nodeDef)),
    [chainUuid, cycle]
  )

  const { options, optionsByDimensionUuid } = useMemo(() => {
    if (!entityDef) return { options: [], optionsByDimensionUuid: {} }
    const _options = []
    const _optionsByDimensionUuid = {}
    Survey.visitAncestorsAndSelf(entityDef, (ancestorDef) => {
      const dimensionsInAncestor = Survey.getNodeDefDescendantAttributesInSingleEntities({
        nodeDef: ancestorDef,
        includeAnalysis: showAnalysisAttributes,
      })(survey).filter(isDimensionIncluded)

      const nestedOptions = dimensionsInAncestor.map((dimension) => {
        const dimensionUuid = NodeDef.getUuid(dimension)
        const nestedOption = {
          value: dimensionUuid,
          label: NodeDef.getLabel(dimension, lang, labelType),
          icon: NodeDefUIProps.getIconByType(NodeDef.getType(dimension)),
        }
        _optionsByDimensionUuid[dimensionUuid] = nestedOption
        return nestedOption
      })
      _options.push({
        value: NodeDef.getUuid(ancestorDef),
        label: NodeDef.getLabel(ancestorDef, lang, labelType),
        options: nestedOptions,
      })
    })(survey)
    return { options: _options, optionsByDimensionUuid: _optionsByDimensionUuid }
  }, [entityDef, isDimensionIncluded, labelType, lang, showAnalysisAttributes, survey])

  const selectedOptions = useMemo(
    () => selectedDimensionsUuids.map((dimensionUuid) => optionsByDimensionUuid[dimensionUuid]).filter(Boolean),
    [optionsByDimensionUuid, selectedDimensionsUuids]
  )

  const onChange = useCallback(
    (_selectedOptions) => {
      const dimensionUuidsUpdated = _selectedOptions.map((option) => option.value)
      onDimensionsChange(dimensionUuidsUpdated)
    },
    [onDimensionsChange]
  )

  return (
    <Dropdown
      className="dimensions-selector"
      disabled={disabled}
      multiple
      items={options}
      onChange={onChange}
      selection={selectedOptions}
    />
  )
}

DimensionsSelector.propTypes = {
  chainUuid: PropTypes.string.isRequired,
  entityDefUuid: PropTypes.string,
  disabled: PropTypes.bool,
  labelType: PropTypes.string,
  onDimensionsChange: PropTypes.func.isRequired,
  selectedDimensionsUuids: PropTypes.array,
  showAnalysisAttributes: PropTypes.bool,
}
