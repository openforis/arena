import { useState } from 'react'
import { useSelector } from 'react-redux'

import * as A from '@core/arena'
import * as Survey from '@core/survey/survey'
import * as NodeDefLayout from '@core/survey/nodeDefLayout'

import { useSurvey } from '@webapp/store/survey'
import { SurveyFormState } from '@webapp/store/ui/surveyForm'

import { useOnUpdate } from '@webapp/components/hooks'

import { State } from './state'

export const useLocalState = (props) => {
  const survey = useSurvey()
  const rootNodeDef = Survey.getNodeDefRoot(survey)
  const { edit, nodeDef = rootNodeDef, level, surveyCycleKey, canEditDef } = props

  const parentNode = useSelector(SurveyFormState.getFormPageParentNode(nodeDef))
  const expandedFormPageNavigation = useSelector(SurveyFormState.expandedPageNavigation)
  const active = useSelector(SurveyFormState.isNodeDefFormActivePage(nodeDef))

  const childDefs = Survey.getNodeDefChildren(nodeDef)(survey)
  const outerPageChildDefs = NodeDefLayout.filterNodeDefsWithPage(surveyCycleKey)(childDefs)

  const [state, setState] = useState(() =>
    State.create({
      nodeDef,
      rootNodeDef,
      edit,
      parentNode,
      childDefs,
      level,
      active,
      expandedFormPageNavigation,
      outerPageChildDefs,
      canEditDef,
      surveyCycleKey,
    })
  )

  useOnUpdate(() => {
    setState(
      A.pipe(
        State.assocShowChildren(expandedFormPageNavigation),
        State.assocExpandedFormPageNavigation(expandedFormPageNavigation)
      )(state)
    )
  }, [expandedFormPageNavigation])

  useOnUpdate(() => {
    setState(State.assocActive(active))
  }, [active])

  useOnUpdate(() => {
    setState(State.assocParentNode(parentNode))
  }, [parentNode])

  useOnUpdate(() => {
    setState(
      State.assocOuterPageChildDefs(
        NodeDefLayout.filterNodeDefsWithPage(surveyCycleKey)(Survey.getNodeDefChildren(nodeDef)(survey))
      )
    )
  }, [nodeDef, survey, surveyCycleKey])

  return {
    state,
    setState,
  }
}
