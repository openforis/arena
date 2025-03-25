import { useCallback, useState } from 'react'

import { ArrayUtils } from '@core/arrayUtils'
import { ExtraPropDef } from '@core/survey/extraPropDef'

import { useConfirm } from '@webapp/components/hooks'
import { useAuthCanEditSurvey } from '@webapp/store/user'
import { useI18n } from '@webapp/store/system'

export const useExtraPropDefsEditor = (props) => {
  const { extraPropDefs: extraPropDefsProp, onExtraPropDefDelete, onExtraPropDefUpdate } = props

  const i18n = useI18n()
  const readOnly = !useAuthCanEditSurvey()
  const confirm = useConfirm()

  const [state, setState] = useState({ extraPropDefs: extraPropDefsProp })

  const { extraPropDefs } = state

  const updateExtraPropDefsState = useCallback(
    (extraPropDefsUpdated) => setState((statePrev) => ({ ...statePrev, extraPropDefs: extraPropDefsUpdated })),
    []
  )

  const onItemAdd = useCallback(async () => {
    const extraPropDef = {
      ...ExtraPropDef.newItem({ dataType: ExtraPropDef.dataTypes.text, index: Object.values(extraPropDefs).length }),
      name: '', // name property is used only in UI
      newItem: true,
    }
    updateExtraPropDefsState([...extraPropDefs, extraPropDef])
  }, [extraPropDefs, updateExtraPropDefsState])

  const onItemDelete = useCallback(
    ({ index }) => {
      const itemExtraDefOld = extraPropDefs[index]
      const name = ExtraPropDef.getName(itemExtraDefOld)
      const { newItem } = itemExtraDefOld
      if (newItem) {
        const itemExtraDefsUpdated = ArrayUtils.removeItemAtIndex({ index })(extraPropDefs).map((item, index) =>
          ExtraPropDef.assocIndex(index)(item)
        )
        updateExtraPropDefsState(itemExtraDefsUpdated)
      } else {
        confirm({
          key: 'extraProp.editor.confirmDelete',
          params: { name },
          onOk: () => {
            const itemExtraDefsUpdated = ArrayUtils.removeItemAtIndex({ index })(extraPropDefs)
            updateExtraPropDefsState(itemExtraDefsUpdated)

            onExtraPropDefDelete({
              propName: ExtraPropDef.getName(itemExtraDefOld),
              deleted: true,
            })
          },
        })
      }
    },
    [confirm, extraPropDefs, onExtraPropDefDelete, updateExtraPropDefsState]
  )

  const onItemUpdate = useCallback(
    async ({ index, extraPropDefUpdated }) => {
      const extraPropDefOld = extraPropDefs[index]

      const itemExtraDefsUpdated = [...extraPropDefs]
      itemExtraDefsUpdated[index] = extraPropDefUpdated
      updateExtraPropDefsState(itemExtraDefsUpdated)

      onExtraPropDefUpdate({
        propName: ExtraPropDef.getName(extraPropDefOld),
        extraPropDef: extraPropDefUpdated,
      })
    },
    [extraPropDefs, onExtraPropDefUpdate, updateExtraPropDefsState]
  )

  return {
    i18n,
    extraPropDefs,
    onItemAdd,
    onItemDelete,
    onItemUpdate,
    readOnly,
  }
}
