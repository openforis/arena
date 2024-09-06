import React, { useCallback, useEffect } from 'react'
import PropTypes from 'prop-types'

import * as A from '@core/arena'

import { useI18n } from '@webapp/store/system'
import { FormItem, Input } from '@webapp/components/form/Input'
import ButtonGroup from '@webapp/components/form/buttonGroup'

import * as NodeDef from '@core/survey/nodeDef'
import * as Validation from '@core/validation/validation'

import { State } from './store'

const fileTypes = ({ i18n }) =>
  Object.values(NodeDef.fileTypeValues).map((fileType) => ({
    key: fileType,
    label: i18n.t(`nodeDefEdit.fileProps.fileTypes.${fileType}`),
  }))

const FileProps = (props) => {
  const { state, Actions } = props

  const i18n = useI18n()

  const nodeDef = State.getNodeDef(state)
  const validation = State.getValidation(state)

  const selectFileType = useCallback(
    (value) => {
      Actions.setProp({ state, key: NodeDef.propKeys.fileType, value })
    },
    [state]
  )

  useEffect(() => {
    if (A.isEmpty(NodeDef.getFileType(nodeDef))) {
      selectFileType(NodeDef.fileTypeValues.other)
    }
  }, [])

  return (
    <>
      {NodeDef.isNumberOfFilesEnabled(nodeDef) && (
        <FormItem label="">
          <p>{i18n.t('nodeDefEdit.fileProps.numberOfFiles')}</p>
        </FormItem>
      )}

      <FormItem label={i18n.t('nodeDefEdit.fileProps.fileType')}>
        <ButtonGroup
          selectedItemKey={NodeDef.getFileType(nodeDef)}
          onChange={selectFileType}
          items={fileTypes({ i18n })}
        />
      </FormItem>
      <FormItem label={i18n.t('nodeDefEdit.fileProps.maxFileSize')}>
        <Input
          className="max-file-size"
          disabled={false}
          placeholder={i18n.t('nodeDefEdit.fileProps.maxFileSize')}
          value={NodeDef.getMaxFileSize(nodeDef)}
          type="number"
          onChange={(value) => Actions.setProp({ state, key: NodeDef.propKeys.maxFileSize, value })}
          validation={Validation.getFieldValidation(NodeDef.propKeys.maxFileSize)(validation)}
        />
      </FormItem>
      <FormItem label={i18n.t('nodeDefEdit.fileProps.fileNameExpression')}>
        <Input
          onChange={(value) => Actions.setProp({ state, key: NodeDef.keysPropsAdvanced.fileNameExpression, value })}
          validation={Validation.getFieldValidation(NodeDef.keysPropsAdvanced.fileNameExpression)(validation)}
          value={NodeDef.getFileNameExpression(nodeDef)}
        />
      </FormItem>
    </>
  )
}

FileProps.propTypes = {
  state: PropTypes.object.isRequired,
  Actions: PropTypes.object.isRequired,
}

export default FileProps
