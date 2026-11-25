import { useCallback } from 'react'

import * as NodeDef from '@core/survey/nodeDef'
import { ButtonIconDelete } from '@webapp/components/buttons'
import { useAppDispatch } from '@webapp/store'
import { useSurveyPreferredLang } from '@webapp/store/survey'
import { useI18n } from '@webapp/store/system'
import { DialogConfirmActions } from '@webapp/store/ui'
import { RecordActions } from '@webapp/store/ui/record'

type NodeDeleteButtonProps = {
  nodeDef: any
  node: any
  disabled?: boolean
  removeNode?: (...args: any[]) => any
  showConfirm?: boolean
}

const NodeDeleteButton = (props: NodeDeleteButtonProps) => {
  const { disabled = false, nodeDef, node, removeNode, showConfirm = true } = props

  const dispatch = useAppDispatch()
  const i18n = useI18n()
  const lang = useSurveyPreferredLang()

  const onClick = useCallback(() => {
    const nodeDefTypeKey = NodeDef.isEntity(nodeDef) ? 'common.entity' : 'common.attribute'
    const nodeDefType = i18n.t(nodeDefTypeKey).toLocaleLowerCase()
    const nodeDefLabel = NodeDef.getLabel(nodeDef, lang)

    const performDelete = () => dispatch(RecordActions.removeNode(nodeDef, node))
    const _removeNode = () => (removeNode ? removeNode(nodeDef, node) : null)
    const handleDelete = removeNode ? _removeNode : performDelete

    if (showConfirm) {
      dispatch(
        DialogConfirmActions.showDialogConfirm({
          key: 'surveyForm:confirmNodeDelete',
          params: { nodeDefType, nodeDefLabel },
          onOk: handleDelete,
        })
      )
    } else {
      handleDelete()
    }
  }, [dispatch, i18n, lang, node, nodeDef, removeNode, showConfirm])

  return <ButtonIconDelete disabled={disabled} onClick={onClick} />
}

export default NodeDeleteButton
