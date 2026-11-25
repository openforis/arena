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
 * Returns the attributes sharing the parent entity with the specified node def (the node def itself excluded).
 * @param {!object} params - The parameters.
 * @param {!object} params.survey - The survey.
 * @param {!object} params.nodeDefCurrent - The node def the expression belongs to.
 * @returns {Array} - The sibling attribute defs.
 */
const getSiblingAttributeDefs = ({ survey, nodeDefCurrent }) => {
  const parentDef = Survey.getNodeDefParent(nodeDefCurrent)(survey)
  if (!parentDef) return []
  return Survey.getNodeDefChildren({ nodeDef: parentDef, includeAnalysis: false })(survey).filter(
    (childDef) =>
      !NodeDef.isEntity(childDef) &&
      Expression.isValidExpressionType(childDef) &&
      !NodeDef.isEqual(childDef)(nodeDefCurrent)
  )
}

/**
 * Returns the ancestor entity defs of the specified node def, from the parent one to the root.
 * @param {!object} params - The parameters.
 * @param {!object} params.survey - The survey.
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
  const { callee, expressionNode, nodeDefCurrent, onConfirm } = props

  const i18n = useI18n()
  const survey = useSurvey()
  const lang = useSurveyPreferredLang()

  const items = useMemo(() => {
    if (!nodeDefCurrent) return []
    const groups = [
      {
        label: i18n.t('expressionEditor.siblingAttributes'),
        options: getSiblingAttributeDefs({ survey, nodeDefCurrent }).map((nodeDef) => toItem({ nodeDef, lang })),
      },
      {
        label: i18n.t('expressionEditor.ancestorEntities'),
        options: getAncestorEntityDefs({ survey, nodeDefCurrent }).map((nodeDef) => toItem({ nodeDef, lang })),
      },
    ]
    return groups.filter((group) => group.options.length > 0)
  }, [i18n, lang, nodeDefCurrent, survey])

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
