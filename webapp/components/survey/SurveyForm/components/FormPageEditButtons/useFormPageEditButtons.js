import { useCallback, useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'

import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefLayout from '@core/survey/nodeDefLayout'
import * as Survey from '@core/survey/survey'

import { NodeDefsActions, useSurvey, useSurveyCycleKey } from '@webapp/store/survey'
import { useNodeDefPage } from '@webapp/store/ui/surveyForm'

export const useFormPageEditButtons = () => {
  const dispatch = useDispatch()

  const nodeDefPage = useNodeDefPage()
  const survey = useSurvey()
  const cycle = useSurveyCycleKey()

  const [upDisabled, setUpDisabled] = useState(false)
  const [downDisabled, setDownDisabled] = useState(false)

  const getSiblingUuids = useCallback(() => {
    if (!nodeDefPage || NodeDef.isRoot(nodeDefPage)) return []
    const nodeDefParent = Survey.getNodeDefParent(nodeDefPage)(survey)
    const siblings = Survey.getNodeDefChildrenInOwnPage({ nodeDef: nodeDefParent, cycle })(survey)
    const siblingUuids = siblings.map(NodeDef.getUuid)
    return siblingUuids
  }, [survey, cycle, nodeDefPage])

  const moveNodeDefPage = useCallback(
    (up = true) => {
      // calculate previous children index
      const siblingUuids = getSiblingUuids()
      const { uuid: nodeDefUuid } = nodeDefPage
      const pageIndexPrev = siblingUuids.indexOf(nodeDefUuid)

      const childrenIndexUpdated = [...siblingUuids]

      // determine new children index
      const pageIndexNew = pageIndexPrev + (up ? -1 : 1)

      // swap items in children index
      childrenIndexUpdated[pageIndexPrev] = childrenIndexUpdated[pageIndexNew]
      childrenIndexUpdated[pageIndexNew] = nodeDefUuid

      const nodeDefParent = Survey.getNodeDefParent(nodeDefPage)(survey)

      dispatch(
        NodeDefsActions.putNodeDefLayoutProp({
          nodeDef: nodeDefParent,
          key: NodeDefLayout.keys.indexChildren,
          value: childrenIndexUpdated,
        })
      )
    },
    [dispatch, getSiblingUuids, nodeDefPage, survey]
  )

  useEffect(() => {
    const siblingUuids = getSiblingUuids()
    const { uuid: nodeDefUuid } = nodeDefPage
    const pageIndex = siblingUuids.indexOf(nodeDefUuid)
    setUpDisabled(siblingUuids.length <= 1 || pageIndex === 0)
    setDownDisabled(siblingUuids.length <= 1 || pageIndex === siblingUuids.length - 1)
  }, [getSiblingUuids, nodeDefPage])

  const onMoveUp = () => moveNodeDefPage(true)
  const onMoveDown = () => moveNodeDefPage(false)

  return {
    onMoveUp,
    onMoveDown,
    upDisabled,
    downDisabled,
  }
}
