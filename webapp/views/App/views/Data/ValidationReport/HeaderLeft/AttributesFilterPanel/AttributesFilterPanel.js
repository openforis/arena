import React, { useCallback, useEffect, useMemo } from 'react'
import PropTypes from 'prop-types'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

import { Checkbox } from '@webapp/components/form'
import { NodeDefTreeSelect } from '@webapp/components/survey/NodeDefsSelector'
import { useSurvey, useSurveyCycleKey } from '@webapp/store/survey'

export const AttributesFilterPanel = ({
  allAttributeDefUuids,
  allAttributesSelected,
  containerRef,
  onClose,
  onSelectedAttributeDefUuidsChange,
  selectedAttributeDefUuids,
}) => {
  const survey = useSurvey()
  const cycle = useSurveyCycleKey()
  const rootNodeDef = Survey.getNodeDefRoot(survey)

  const selectedAttributeDefUuidsSet = useMemo(() => new Set(selectedAttributeDefUuids), [selectedAttributeDefUuids])

  const descendantAttributeDefUuidsByNodeDefUuid = useMemo(() => {
    if (!rootNodeDef) return {}

    const map = {}
    const visit = (nodeDef) => {
      const nodeDefUuid = NodeDef.getUuid(nodeDef)
      const children = Survey.getNodeDefChildrenSorted({ nodeDef, cycle })(survey)
      const attributeDefUuids = NodeDef.isAttribute(nodeDef) && !NodeDef.isAnalysis(nodeDef) ? [nodeDefUuid] : []

      children.forEach((childDef) => {
        attributeDefUuids.push(...visit(childDef))
      })

      map[nodeDefUuid] = [...new Set(attributeDefUuids)]
      return map[nodeDefUuid]
    }

    visit(rootNodeDef)
    return map
  }, [cycle, rootNodeDef, survey])

  const onAttributeSelectionChange = useCallback(
    (attributeDefUuids, selected) => {
      if (!attributeDefUuids?.length) return
      const next = new Set(selectedAttributeDefUuids)
      attributeDefUuids.forEach((attributeDefUuid) => {
        if (selected) {
          next.add(attributeDefUuid)
        } else {
          next.delete(attributeDefUuid)
        }
      })
      onSelectedAttributeDefUuidsChange([...next])
    },
    [onSelectedAttributeDefUuidsChange, selectedAttributeDefUuids]
  )

  const getSelectionStatusByNodeDefUuid = useCallback(
    (nodeDefUuid) => {
      const descendantAttributeDefUuids = descendantAttributeDefUuidsByNodeDefUuid[nodeDefUuid] ?? []
      if (!descendantAttributeDefUuids.length) return { checked: false, indeterminate: false, selectable: false }

      const selectedCount = descendantAttributeDefUuids.filter((uuid) => selectedAttributeDefUuidsSet.has(uuid)).length
      return {
        checked: selectedCount === descendantAttributeDefUuids.length,
        indeterminate: selectedCount > 0 && selectedCount < descendantAttributeDefUuids.length,
        selectable: true,
      }
    },
    [descendantAttributeDefUuidsByNodeDefUuid, selectedAttributeDefUuidsSet]
  )

  // Close the panel when the user clicks outside of it (and outside of its toggle button).
  useEffect(() => {
    const onDocumentMouseDown = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', onDocumentMouseDown)
    return () => document.removeEventListener('mousedown', onDocumentMouseDown)
  }, [containerRef, onClose])

  return (
    <div className="validation-report__attributes-filter-panel">
      <Checkbox
        checked={allAttributesSelected}
        className="select-all"
        indeterminate={!allAttributesSelected && selectedAttributeDefUuids.length > 0}
        label="common.selectAll"
        onChange={(selected) => onSelectedAttributeDefUuidsChange(selected ? allAttributeDefUuids : [])}
      />
      <NodeDefTreeSelect
        disableSelection
        includeMultipleAttributes
        includeSingleAttributes
        includeSingleEntities
        isNodeDefIncluded={(nodeDef) =>
          NodeDef.isEntity(nodeDef) || (NodeDef.isAttribute(nodeDef) && !NodeDef.isAnalysis(nodeDef))
        }
        onSelect={() => null}
        renderItemPrefix={(item) => {
          const { checked, indeterminate, selectable } = getSelectionStatusByNodeDefUuid(item.key)
          if (!selectable) return null
          return (
            <Checkbox
              checked={checked}
              indeterminate={indeterminate}
              onChange={(selected) =>
                onAttributeSelectionChange(descendantAttributeDefUuidsByNodeDefUuid[item.key] ?? [], selected)
              }
            />
          )
        }}
      />
    </div>
  )
}

AttributesFilterPanel.propTypes = {
  allAttributeDefUuids: PropTypes.array.isRequired,
  allAttributesSelected: PropTypes.bool.isRequired,
  containerRef: PropTypes.object.isRequired,
  onClose: PropTypes.func.isRequired,
  onSelectedAttributeDefUuidsChange: PropTypes.func.isRequired,
  selectedAttributeDefUuids: PropTypes.array.isRequired,
}
