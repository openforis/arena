import { useCallback, useMemo } from 'react'

import * as Expression from '@core/expressionParser/expression'
import * as NodeDef from '@core/survey/nodeDef'
import * as Survey from '@core/survey/survey'
import { Dropdown } from '@webapp/components/form'
import { FormItem } from '@webapp/components/form/Input'
import { useSurvey, useSurveyPreferredLang } from '@webapp/store/survey'
import { useI18n } from '@webapp/store/system'

import type { CallEditorProps } from './callEditorProps'

const toItem = ({ nodeDef, lang }) => {
  const name = NodeDef.getName(nodeDef)
  const label = NodeDef.getLabel(nodeDef, lang)
  return { value: name, label: label === name ? name : `${label} (${name})` }
}

/**
 * Returns the groups (by entity) of the attributes reachable from the current node def (the variables of the
 * expression editor: attributes of the ancestor entities and of their single entities), the current one excluded.
 * @param {!Array} variables - The expression editor variables (grouped by parent entity).
 * @param {!object} nodeDefCurrent - The node def the expression belongs to.
 * @returns {Array} - The attribute groups.
 */
const getReachableAttributeGroups = ({ variables, nodeDefCurrent }) => {
  const isAttributeVariable = (variable) =>
    variable.nodeDefType !== NodeDef.nodeDefType.entity &&
    variable.value !== Expression.thisVariable &&
    variable.uuid !== NodeDef.getUuid(nodeDefCurrent)
  return (variables ?? [])
    .filter((group) => !!group.options)
    .map((group) => ({ label: group.label, options: group.options.filter(isAttributeVariable) }))
    .filter((group) => group.options.length > 0)
}

/**
 * Returns the ancestor entity defs of the specified node def, from the parent one to the root.
 * @param {!object} params - The parameters.
 * @param {!object} params.nodeDefCurrent - The node def the expression belongs to.
 * @returns {Array} - The ancestor entity defs.
 */
const getAncestorEntityDefs = ({ survey, nodeDefCurrent }) => {
  const ancestorDefs = []
  let ancestorDef = Survey.getNodeDefParent(nodeDefCurrent)(survey)
  while (ancestorDef) {
    ancestorDefs.push(ancestorDef)
    ancestorDef = Survey.getNodeDefParent(ancestorDef)(survey)
  }
  return ancestorDefs
}

type CallNodeDateEditorProps = CallEditorProps & {
  callee: string
}

const CallNodeDateEditor = (props: CallNodeDateEditorProps) => {
  const { callee, expressionNode, nodeDefCurrent, onConfirm, variables } = props

  const i18n = useI18n()
  const survey = useSurvey()
  const lang = useSurveyPreferredLang()

  const items = useMemo(() => {
    if (!nodeDefCurrent) return []
    const ancestorEntitiesGroup = {
      label: i18n.t('expressionEditor.ancestorEntities'),
      options: getAncestorEntityDefs({ survey, nodeDefCurrent }).map((nodeDef) => toItem({ nodeDef, lang })),
    }
    return [
      ...getReachableAttributeGroups({ variables, nodeDefCurrent }),
      ...(ancestorEntitiesGroup.options.length > 0 ? [ancestorEntitiesGroup] : []),
    ]
  }, [i18n, lang, nodeDefCurrent, survey, variables])

  const argumentName = expressionNode?.arguments?.[0]?.name
  const selection = argumentName
    ? (items.flatMap((group) => group.options).find((item) => item.value === argumentName) ?? null)
    : null

  const onChange = useCallback(
    (item) => {
      const params = item?.value ? [Expression.newIdentifier(item.value)] : []
      onConfirm(Expression.newCall({ callee, params }))
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
