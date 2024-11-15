import React, { useCallback, useEffect } from 'react'
import PropTypes from 'prop-types'

import * as A from '@core/arena'
import * as NodeDef from '@core/survey/nodeDef'
import * as Validation from '@core/validation/validation'
import * as ProcessUtils from '@core/processUtils'

import { useI18n } from '@webapp/store/system'

import { FormItem, Input } from '@webapp/components/form/Input'
import ButtonGroup from '@webapp/components/form/buttonGroup'

import { State } from './store'
import { NodeDefSingleExpressionProp } from './ExpressionsProp/NodeDefSingleExpressionProp'

const fileTypes = Object.keys(NodeDef.fileTypeValues).map((key) => ({
  key,
  label: `nodeDefEdit.fileProps.fileTypes.${key}`,
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
    [Actions, state]
  )

  useEffect(() => {
    if (A.isEmpty(NodeDef.getFileType(nodeDef))) {
      selectFileType(NodeDef.fileTypeValues.other)
    }
  }, [nodeDef, selectFileType])

  return (
    <>
      {NodeDef.isNumberOfFilesEnabled(nodeDef) && (
        <FormItem label="">
          <p>{i18n.t('nodeDefEdit.fileProps.numberOfFiles')}</p>
        </FormItem>
      )}
      <FormItem label="nodeDefEdit.fileProps.maxFileSize">
        <Input
          className="max-file-size"
          disabled={false}
          placeholder="nodeDefEdit.fileProps.maxFileSize"
          value={NodeDef.getMaxFileSize(nodeDef)}
          type="number"
          onChange={(value) => Actions.setProp({ state, key: NodeDef.propKeys.maxFileSize, value })}
          validation={Validation.getFieldValidation(NodeDef.propKeys.maxFileSize)(validation)}
        />
      </FormItem>
      {ProcessUtils.ENV.experimentalFeatures && (
        <FormItem label="nodeDefEdit.fileProps.fileNameExpression">
          <NodeDefSingleExpressionProp
            canBeConstant
            excludeCurrentNodeDef
            isBoolean={false}
            nodeDef={nodeDef}
            onChange={({ query: value }) => {
              Actions.setProp({ state, key: NodeDef.keysPropsAdvanced.fileNameExpression, value })
            }}
            qualifier="fileNameExpression"
            query={NodeDef.getFileNameExpression(nodeDef)}
            validation={Validation.getFieldValidation(NodeDef.keysPropsAdvanced.fileNameExpression)(validation)}
          />
        </FormItem>
      )}
      <FormItem label="nodeDefEdit.fileProps.fileType">
        <ButtonGroup selectedItemKey={NodeDef.getFileType(nodeDef)} onChange={selectFileType} items={fileTypes} />
      </FormItem>
    </>
  )
}

FileProps.propTypes = {
  state: PropTypes.object.isRequired,
  Actions: PropTypes.object.isRequired,
}

export default FileProps
