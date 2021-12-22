import { useCallback } from 'react'
import { useNavigate } from 'react-router'

import { appModuleUri, designerModules } from '@webapp/app/appModules'

import { useCancelEdits } from './useCancelEdits'
import { useGetSiblingNodeDefUuid } from './useGetSiblingNodeDefUuid'

export const useGoToNodeDef = ({ setState }) => {
  const navigate = useNavigate()

  const cancelEdits = useCancelEdits({ setState })

  const getSiblingNodeDefUuid = useGetSiblingNodeDefUuid()

  return useCallback(async ({ state, offset }) => {
    cancelEdits({
      state,
      offset,
      onCancel: ({ state }) => {
        const nodeDefUuidSibling = getSiblingNodeDefUuid({ state, offset })
        // wait for local state to reset and navigate to the next node def
        setTimeout(() => {
          navigate(`${appModuleUri(designerModules.nodeDef)}${nodeDefUuidSibling}/`)
        }, 100)
      },
    })
  }, [])
}
