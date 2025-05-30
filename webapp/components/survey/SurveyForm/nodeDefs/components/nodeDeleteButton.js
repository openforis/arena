import React, { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import PropTypes from 'prop-types'

import * as NodeDef from '@core/survey/nodeDef'
import { DialogConfirmActions } from '@webapp/store/ui'

import { RecordActions } from '@webapp/store/ui/record'
import { ButtonIconDelete } from '@webapp/components/buttons'
import { useI18n } from '@webapp/store/system'
import { useSurveyPreferredLang } from '@webapp/store/survey'

const NodeDeleteButton = (props) => {
  const { disabled = false, nodeDef, node, removeNode, showConfirm = true } = props

  const dispatch = useDispatch()
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

NodeDeleteButton.propTypes = {
  nodeDef: PropTypes.any.isRequired,
  node: PropTypes.any.isRequired,
  disabled: PropTypes.bool,
  removeNode: PropTypes.func,
  showConfirm: PropTypes.bool,
}

export default NodeDeleteButton
