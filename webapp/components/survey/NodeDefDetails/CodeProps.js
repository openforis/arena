import React, { useState } from 'react'
import PropTypes from 'prop-types'
import * as R from 'ramda'

import { useI18n } from '@webapp/store/system'
import { FormItem } from '@webapp/components/form/input'
import Dropdown from '@webapp/components/form/Dropdown'
import ButtonGroup from '@webapp/components/form/buttonGroup'
import CategorySelector from '@webapp/components/survey/CategorySelector'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Category from '@core/survey/category'
import * as NodeDefLayout from '@core/survey/nodeDefLayout'
import * as Validation from '@core/validation/validation'

import { useSurveyCycleKey, useSurvey } from '@webapp/store/survey'
import { State } from './store'

const displayAsItems = ({ i18n }) => [
  {
    key: NodeDefLayout.renderType.checkbox,
    label: i18n.t('nodeDefEdit.codeProps.displayAsTypes.checkbox'),
  },
  {
    key: NodeDefLayout.renderType.dropdown,
    label: i18n.t('nodeDefEdit.codeProps.displayAsTypes.dropdown'),
  },
]

const CodeProps = (props) => {
  const { state, Actions } = props

  const i18n = useI18n()
  const surveyCycleKey = useSurveyCycleKey()
  const survey = useSurvey()

  const [category, setCategory] = useState(null)

  const nodeDef = State.getNodeDef(state)
  const validation = State.getValidation(state)
  const canUpdateCategory = Survey.canUpdateCategory(nodeDef)(survey)
  const candidateParentCodeNodeDefs = Survey.getNodeDefCodeCandidateParents({ nodeDef, category })(survey)
  const parentCodeDef = Survey.getNodeDefParentCode(nodeDef)(survey)

  const disabled = !canUpdateCategory

  const setCategoryProp = (categorySelected) =>
    Actions.setProp({ state, key: NodeDef.propKeys.categoryUuid, value: Category.getUuid(categorySelected) })

  return (
    <>
      <FormItem label={i18n.t('nodeDefEdit.codeProps.category')}>
        <CategorySelector
          disabled={disabled}
          categoryUuid={NodeDef.getCategoryUuid(nodeDef)}
          validation={Validation.getFieldValidation(NodeDef.propKeys.categoryUuid)(validation)}
          editingNodeDef
          analysis={NodeDef.isAnalysis(nodeDef)}
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
                disabled={disabled || R.isEmpty(candidateParentCodeNodeDefs)}
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
