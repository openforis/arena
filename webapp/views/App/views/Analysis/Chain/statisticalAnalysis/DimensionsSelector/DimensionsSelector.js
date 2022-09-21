import './DimensionsSelector.scss'

import React, { useCallback } from 'react'
import Select, { components } from 'react-select'
import PropTypes from 'prop-types'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

import { useSurvey, useSurveyCycleKey } from '@webapp/store/survey'
import * as NodeDefUIProps from '@webapp/components/survey/SurveyForm/nodeDefs/nodeDefUIProps'

const OptionComponent = (props) => {
  const { data } = props
  const { label, icon } = data

  return (
    <components.Option {...props}>
      <span>{label}</span>
      {icon}
    </components.Option>
  )
}

export const DimensionsSelector = (props) => {
  const { chainUuid, entityDefUuid, dimensionUuids, onDimensionsChange, showAnalysisAttributes } = props

  const cycle = useSurveyCycleKey()
  const survey = useSurvey()

  const options = []
  const entityDef = Survey.getNodeDefByUuid(entityDefUuid)(survey)

  const isDimensionIncluded = (nodeDef) =>
    NodeDef.isSingleAttribute(nodeDef) &&
    [NodeDef.nodeDefType.boolean, NodeDef.nodeDefType.code, NodeDef.nodeDefType.taxon].includes(
      NodeDef.getType(nodeDef)
    ) &&
    NodeDef.isInCycle(cycle)(nodeDef) &&
    (!chainUuid || !NodeDef.getChainUuid(nodeDef) || chainUuid === NodeDef.getChainUuid(nodeDef))

  Survey.visitAncestorsAndSelf(entityDef, (ancestorDef) => {
    const dimensionsInAncestor = Survey.getNodeDefDescendantAttributesInSingleEntities(
      ancestorDef,
      showAnalysisAttributes
    )(survey).filter(isDimensionIncluded)

    const nestedOptions = dimensionsInAncestor.map((dimension) => ({
      value: NodeDef.getUuid(dimension),
      label: NodeDef.getName(dimension),
      icon: NodeDefUIProps.getIconByType(NodeDef.getType(dimension)),
    }))

    const option = {
      value: NodeDef.getUuid(ancestorDef),
      label: NodeDef.getName(ancestorDef),
      options: nestedOptions,
    }
    options.push(option)
  })(survey)

  const selectedOptions = options
    .flatMap((ancestorDefOption) => ancestorDefOption.options)
    .filter((option) => dimensionUuids.includes(option.value))

  const onChange = useCallback(
    (_selectedOptions) => {
      const dimensionUuidsUpdated = _selectedOptions.map((option) => option.value)
      onDimensionsChange(dimensionUuidsUpdated)
    },
    [onDimensionsChange]
  )

  return (
    <Select
      className="dimensions-selector"
      classNamePrefix="select"
      components={{ Option: OptionComponent }}
      defaultValue={selectedOptions}
      isMulti
      options={options}
      onChange={onChange}
    />
  )
}

DimensionsSelector.propTypes = {
  chainUuid: PropTypes.string.isRequired,
  entityDefUuid: PropTypes.string.isRequired,
  dimensionUuids: PropTypes.array.isRequired,
  onDimensionsChange: PropTypes.func.isRequired,
  showAnalysisAttributes: PropTypes.bool,
}

DimensionsSelector.defaultValues = {
  chainUuid: undefined,
  showAnalysisAttributes: false,
}
