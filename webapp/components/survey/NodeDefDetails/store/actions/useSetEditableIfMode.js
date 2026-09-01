import { useCallback } from 'react'

import * as NodeDef from '@core/survey/nodeDef'

import { State } from '../state'
import { useValidate } from './useValidate'

/**
 * Returns an action that atomically applies all editableIf-related prop changes.
 * Using separate setProp calls causes stale-state overwrites because each reads
 * from the same captured state object; this action reads nodeDef once and builds the full update.
 * @param {object} params - Params.
 * @param {Function} params.setState - Local state setter.
 * @returns {Function} - The action.
 */
export const useSetEditableIfMode = ({ setState }) => {
  const validateNodeDef = useValidate({ setState })

  return useCallback(
    /**
     * @param {object} params - Params.
     * @param {object} params.state - Current local state.
     * @param {boolean} params.clearEditableIf - Whether to reset the editableIf expressions.
     * @param {boolean} params.readOnly - New value for the readOnly prop.
     * @returns {Promise<void>} - Resolves when validation completes.
     */
    async ({ state, clearEditableIf, readOnly }) => {
      const nodeDef = State.getNodeDef(state)

      let nodeDefUpdated = nodeDef

      if (clearEditableIf) {
        nodeDefUpdated = NodeDef.assocProp({ key: NodeDef.keysPropsAdvanced.editableIf, value: [] })(nodeDefUpdated)
      }
      nodeDefUpdated = NodeDef.assocProp({ key: NodeDef.propKeys.readOnly, value: readOnly })(nodeDefUpdated)

      await validateNodeDef({ nodeDef, nodeDefUpdated })
    },
    [validateNodeDef]
  )
}
