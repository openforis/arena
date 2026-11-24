import { useCallback, useMemo } from 'react'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

import { useI18n } from '@webapp/store/system'
import { useSurvey } from '@webapp/store/survey'
import { useChain, useChainEditable } from '@webapp/store/ui/chain'

import { Dropdown } from '@webapp/components/form'
import { FormItem } from '@webapp/components/form/Input'

const nodeDefToItem = (nodeDef) => ({
  value: NodeDef.getUuid(nodeDef),
  label: NodeDef.getLabel(nodeDef, null, NodeDef.NodeDefLabelTypes.name),
})

type BaseUnitAttributeSelectorProps = {
  allowEmptySelection?: boolean
  info?: string
  label: string
  nodeDefFilter?: (...args: any[]) => any
  nodeDefTypes?: string[]
  onChange: (...args: any[]) => any
  selectedNodeDefUuid?: string
}

export const BaseUnitAttributeSelector = (props: BaseUnitAttributeSelectorProps) => {
  const {
    allowEmptySelection,
    info,
    label,
    nodeDefFilter,
    nodeDefTypes = [NodeDef.nodeDefType.code],
    onChange: onChangeProp,
    selectedNodeDefUuid,
  } = props

  const i18n = useI18n()
  const chain = useChain()
  const editable = useChainEditable()
  const survey = useSurvey()

  const baseUnitNodeDef = Survey.getBaseUnitNodeDef({ chain })(survey)

  // selectable attribute defs can be attributes of the allowed types in base unit or its ancestors
  const selectableDefs = useMemo(() => {
    if (!baseUnitNodeDef) return []

    const result = []
    Survey.visitAncestorsAndSelf(baseUnitNodeDef, (nodeDef) => {
      // search inside single entities
      const descendantDefs = Survey.getNodeDefDescendantAttributesInSingleEntities({
        nodeDef,
        includeAnalysis: true,
      })(survey)
      result.push(
        ...descendantDefs.filter(
          (descendantDef) =>
            // only attributes of the allowed types
            nodeDefTypes.includes(NodeDef.getType(descendantDef)) &&
            // avoid duplicates
            !result.some(NodeDef.isEqual(descendantDef)) &&
            (!nodeDefFilter || nodeDefFilter(descendantDef))
        )
      )
    })(survey)

    return result
  }, [baseUnitNodeDef, nodeDefFilter, nodeDefTypes, survey])

  const onChange = useCallback((item) => onChangeProp(item?.value), [onChangeProp])

  const emptySelectionItem = { value: null, label: i18n.t('common.notSpecified') }
  const selectableItems = [...(allowEmptySelection ? [emptySelectionItem] : []), ...selectableDefs.map(nodeDefToItem)]

  const selectedNodeDef = selectedNodeDefUuid ? Survey.getNodeDefByUuid(selectedNodeDefUuid)(survey) : null
  const selectedItem = selectedNodeDef ? nodeDefToItem(selectedNodeDef) : emptySelectionItem

  return (
    <FormItem label={label} info={info}>
      <Dropdown selection={selectedItem} items={selectableItems} onChange={onChange} disabled={!editable} />
    </FormItem>
  )
}
