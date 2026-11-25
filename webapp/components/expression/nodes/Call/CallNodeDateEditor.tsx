import { useCallback, useMemo } from 'react'

import * as Expression from '@core/expressionParser/expression'
import type { ExpressionNode } from '@core/expressionParser/helpers/utils'
import * as NodeDef from '@core/survey/nodeDef'
import * as Survey from '@core/survey/survey'
import { Dropdown } from '@webapp/components/form'
import { FormItem } from '@webapp/components/form/Input'
import { useSurvey } from '@webapp/store/survey'
import { useI18n } from '@webapp/store/system'
import { filterVariablesOrGroups } from '../Identifier'

import type { CallEditorProps } from './callEditorProps'

// entities too: their date modified changes when any of their descendants is modified
const nodeVariablesFilterFn = () => true

/**
 * Returns the items of the ancestor entities of the current node def, from the closest one to the root,
 * referenced with "parent" calls (e.g. parent(this), parent(parent(this))).
 * @param {!object} params - The parameters.
 * @param {!object} params.survey - The survey.
 * @param {object} [params.nodeDefCurrent] - The node def the expression belongs to.
 * @returns {Array} - The dropdown items.
 */
const getAncestorItems = ({ survey, nodeDefCurrent }) => {
  const items = []
  let expression = Expression.thisVariable
  let nodeDef = nodeDefCurrent
  let ancestor = nodeDef ? Survey.getNodeDefParent(nodeDef)(survey) : null
  while (ancestor) {
    expression = `${Expression.functionNames.parent}(${expression})`
    items.push({ value: expression, label: `${NodeDef.getName(ancestor)} (${expression})` })
    nodeDef = ancestor
    ancestor = Survey.getNodeDefParent(nodeDef)(survey)
  }
  return items
}

const findItemByValue = ({ items, value }) => {
  for (const item of items) {
    if (item.value === value) return item
    const found = item.options ? findItemByValue({ items: item.options, value }) : null
    if (found) return found
  }
  return null
}

type CallNodeDateEditorProps = CallEditorProps & {
  callee: string
}

const CallNodeDateEditor = (props: CallNodeDateEditorProps) => {
  const { callee, expressionNode, onConfirm, variables } = props

  const i18n = useI18n()
  const survey = useSurvey()

  const items = useMemo(() => {
    const thisVariable = variables.find((variable) => variable.value === Expression.thisVariable)
    const nodeDefCurrent = thisVariable ? Survey.getNodeDefByUuid(thisVariable.uuid)(survey) : null
    const ancestorItems = getAncestorItems({ survey, nodeDefCurrent })
    const [first, ...others] = filterVariablesOrGroups({ variables, variablesFilterFn: nodeVariablesFilterFn })
    const ancestorsGroup = { label: i18n.t('expressionEditor.ancestorEntities'), options: ancestorItems }
    // "this" first, then the ancestors, then the other nodes
    if (first?.value === Expression.thisVariable) {
      return [first, ...(ancestorItems.length > 0 ? [ancestorsGroup] : []), ...others]
    }
    return [...(ancestorItems.length > 0 ? [ancestorsGroup] : []), ...(first ? [first] : []), ...others]
  }, [i18n, survey, variables])

  const argument = expressionNode?.arguments?.[0]
  const selection = argument ? findItemByValue({ items, value: Expression.toString(argument) }) : null

  const onChange = useCallback(
    (item) => {
      const param = item?.value ? (Expression.fromString(item.value) as ExpressionNode) : null
      onConfirm(Expression.newCall({ callee, params: param ? [param] : [] }))
    },
    [callee, onConfirm]
  )

  return (
    <FormItem label="expressionEditor.node">
      <Dropdown className="identifier" items={items} onChange={onChange} selection={selection} />
    </FormItem>
  )
}

export const CallNodeDateCreatedEditor = (props: CallEditorProps) => (
  <CallNodeDateEditor {...props} callee={Expression.functionNames.nodeDateCreated} />
)

export const CallNodeDateModifiedEditor = (props: CallEditorProps) => (
  <CallNodeDateEditor {...props} callee={Expression.functionNames.nodeDateModified} />
)
