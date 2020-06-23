import React from 'react'
import PropTypes from 'prop-types'
import { useDispatch } from 'react-redux'
import * as R from 'ramda'

import { useI18n } from '@webapp/store/system'
import { FormItem } from '@webapp/components/form/input'
import Dropdown from '@webapp/components/form/dropdown'
import ButtonGroup from '@webapp/components/form/buttonGroup'
import CategorySelector from '@webapp/components/survey/CategorySelector'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Category from '@core/survey/category'
import * as NodeDefLayout from '@core/survey/nodeDefLayout'
import * as Validation from '@core/validation/validation'

import { useSurveyCycleKey, useSurvey } from '@webapp/store/survey'
import * as NodeDefState from '../store/state'
import { useActions } from '../store/actions/index'

const CodeProps = (props) => {
  const { nodeDefState, setNodeDefState } = props

  const dispatch = useDispatch()
  const i18n = useI18n()
  const surveyCycleKey = useSurveyCycleKey()
  const survey = useSurvey()
  const { setNodeDefProp, setNodeDefLayoutProp } = useActions({ nodeDefState, setNodeDefState })

  const nodeDef = NodeDefState.getNodeDef(nodeDefState)
  const validation = NodeDefState.getValidation(nodeDefState)
  const canUpdateCategory = Survey.canUpdateCategory(nodeDef)(survey)
  const candidateParentCodeNodeDefs = Survey.getNodeDefCodeCandidateParents(nodeDef)(survey)
  const parentCodeDef = Survey.getNodeDefParentCode(nodeDef)(survey)

  const displayAsItems = [
    {
      key: NodeDefLayout.renderType.checkbox,
      label: i18n.t('nodeDefEdit.codeProps.displayAsTypes.checkbox'),
    },
    {
      key: NodeDefLayout.renderType.dropdown,
      label: i18n.t('nodeDefEdit.codeProps.displayAsTypes.dropdown'),
    },
  ]

  const disabled = !canUpdateCategory

  const putCategoryProp = (category) => {
    dispatch(setNodeDefProp(NodeDef.propKeys.parentCodeDefUuid, null)) // Reset parent code
    dispatch(setNodeDefProp(NodeDef.propKeys.categoryUuid, Category.getUuid(category)))
  }

  return (
    <>
      <FormItem label={i18n.t('nodeDefEdit.codeProps.category')}>
        <CategorySelector
          disabled={disabled}
          categoryUuid={NodeDef.getCategoryUuid(nodeDef)}
          validation={Validation.getFieldValidation(NodeDef.propKeys.categoryUuid)(validation)}
          analysis={NodeDef.isAnalysis(nodeDef)}
          nodeDefState={nodeDefState}
          onChange={putCategoryProp}
        />
      </FormItem>

      {!NodeDef.isAnalysis(nodeDef) && (
        <>
          <FormItem label={i18n.t('nodeDefEdit.codeProps.parentCode')}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 200px',
              }}
            >
              <Dropdown
                disabled={disabled || R.isEmpty(candidateParentCodeNodeDefs)}
                items={candidateParentCodeNodeDefs}
                selection={parentCodeDef}
                itemKeyProp="uuid"
                itemLabelFunction={NodeDef.getName}
                onChange={(def) => dispatch(setNodeDefProp(NodeDef.propKeys.parentCodeDefUuid, NodeDef.getUuid(def)))}
              />
            </div>
          </FormItem>

          <FormItem label={i18n.t('nodeDefEdit.codeProps.displayAs')}>
            <ButtonGroup
              selectedItemKey={NodeDefLayout.getRenderType(surveyCycleKey)(nodeDef)}
              onChange={(render) => dispatch(setNodeDefLayoutProp(NodeDefLayout.keys.renderType, render))}
              items={displayAsItems}
            />
          </FormItem>
        </>
      )}
    </>
  )
}

CodeProps.propTypes = {
  nodeDefState: PropTypes.object.isRequired,
  setNodeDefState: PropTypes.func.isRequired,
}

export default CodeProps
