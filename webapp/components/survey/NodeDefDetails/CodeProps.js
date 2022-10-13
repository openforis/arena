import React, { useState } from 'react'
import PropTypes from 'prop-types'
import * as R from 'ramda'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Category from '@core/survey/category'
import * as NodeDefLayout from '@core/survey/nodeDefLayout'
import * as Validation from '@core/validation/validation'

import { useI18n } from '@webapp/store/system'
import { useSurveyCycleKey, useSurvey } from '@webapp/store/survey'
import { useAuthCanEditSurvey } from '@webapp/store/user'
import { TestId } from '@webapp/utils/testId'

import { ButtonGroup, Checkbox, Dropdown } from '@webapp/components/form'
import { FormItem } from '@webapp/components/form/Input'
import { CategorySelector } from '@webapp/components/survey/CategorySelector'

import { State } from './store'

const displayAsItems = ({ i18n }) => [
  {
    key: NodeDefLayout.renderType.dropdown,
    label: i18n.t('nodeDefEdit.codeProps.displayAsTypes.dropdown'),
  },
  {
    key: NodeDefLayout.renderType.checkbox,
    label: i18n.t('nodeDefEdit.codeProps.displayAsTypes.checkbox'),
  },
]

const CodeProps = (props) => {
  const { state, Actions } = props

  const i18n = useI18n()
  const surveyCycleKey = useSurveyCycleKey()
  const survey = useSurvey()
  const readOnly = !useAuthCanEditSurvey()

  const [category, setCategory] = useState(null)

  const nodeDef = State.getNodeDef(state)
  const validation = State.getValidation(state)
  const canUpdateCategory = Survey.canUpdateCategory(nodeDef)(survey)
  const candidateParentCodeNodeDefs = Survey.getNodeDefCodeCandidateParents({ nodeDef, category })(survey)
  const parentCodeDef = Survey.getNodeDefParentCode(nodeDef)(survey)

  const setCategoryProp = (categorySelected) =>
    Actions.setProp({ state, key: NodeDef.propKeys.categoryUuid, value: Category.getUuid(categorySelected) })

  return (
    <>
      <FormItem label={i18n.t('nodeDefEdit.codeProps.category')}>
        <CategorySelector
          disabled={!canUpdateCategory}
          categoryUuid={NodeDef.getCategoryUuid(nodeDef)}
          validation={Validation.getFieldValidation(NodeDef.propKeys.categoryUuid)(validation)}
          editingNodeDef
          onChange={setCategoryProp}
          onCategoryLoad={setCategory}
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
                disabled={!canUpdateCategory || R.isEmpty(candidateParentCodeNodeDefs)}
                idInput={TestId.nodeDefDetails.nodeDefCodeParent}
                items={candidateParentCodeNodeDefs}
                selection={parentCodeDef}
                itemKey="uuid"
                itemLabel={NodeDef.getName}
                onChange={(def) =>
                  Actions.setProp({ state, key: NodeDef.propKeys.parentCodeDefUuid, value: NodeDef.getUuid(def) })
                }
              />
            </div>
          </FormItem>

          <FormItem label={i18n.t('nodeDefEdit.codeProps.displayAs')}>
            <ButtonGroup
              selectedItemKey={NodeDefLayout.getRenderType(surveyCycleKey)(nodeDef)}
              onChange={(value) => Actions.setLayoutProp({ state, key: NodeDefLayout.keys.renderType, value })}
              items={displayAsItems({ i18n })}
            />
          </FormItem>

          <FormItem label={i18n.t('nodeDefEdit.codeProps.codeShown')}>
            <Checkbox
              checked={NodeDefLayout.isCodeShown(surveyCycleKey)(nodeDef)}
              disabled={readOnly}
              validation={Validation.getFieldValidation(NodeDefLayout.keys.codeShown)(validation)}
              onChange={(value) => Actions.setLayoutProp({ state, key: NodeDefLayout.keys.codeShown, value })}
            />
          </FormItem>
        </>
      )}
    </>
  )
}

CodeProps.propTypes = {
  state: PropTypes.object.isRequired,
  Actions: PropTypes.object.isRequired,
}

export default CodeProps
