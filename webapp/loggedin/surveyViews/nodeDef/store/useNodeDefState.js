import { useEffect, useState } from 'react'
import { useParams } from 'react-router'

import * as Survey from '@core/survey/survey'

import { useSurvey } from '@webapp/store/survey'
import * as NodeDefState from './nodeDefState'

export const useNodeDefState = () => {
  const { nodeDefUuid } = useParams()

  const survey = useSurvey()

  const [nodeDefState, setNodeDefState] = useState({})

  useEffect(() => {
    // Editing a nodeDef
    if (nodeDefUuid) {
      const nodeDef = Survey.getNodeDefByUuid(nodeDefUuid)(survey)
      const validation = Survey.getNodeDefValidation(nodeDef)(survey)
      setNodeDefState(NodeDefState.assocNodeDefForEdit(nodeDef, validation)(nodeDefState))
    }
  }, [])

  return {
    nodeDefState,
    setNodeDefState,
  }
}
