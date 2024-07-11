import React, { useCallback, useMemo, useState } from 'react'
import PropTypes from 'prop-types'

import { Objects, Strings } from '@openforis/arena-core'

import * as Expression from '@core/expressionParser/expression'
import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Category from '@core/survey/category'
import * as CategoryLevel from '@core/survey/categoryLevel'

import { Button } from '@webapp/components/buttons'
import { Dropdown } from '@webapp/components/form'
import { FormItem } from '@webapp/components/form/Input'
import { CategorySelector } from '@webapp/components/survey/CategorySelector'
import { useSurvey } from '@webapp/store/survey'
import { useI18n } from '@webapp/store/system'

const CategoryLevelVariable = (props) => {
  const { disabled, hierarchicalCategory, level, onChange, selectedAttributeUuid, variables } = props

  const i18n = useI18n()
  const survey = useSurvey()

  const levelUuid = CategoryLevel.getUuid(level)
  const variablesForLevel = variables.reduce((acc, variable) => {
    const options =
      variable.options?.filter((option) => {
        const nodeDef = Survey.getNodeDefByUuid(option.uuid)(survey)
        return NodeDef.isSingleAttribute(nodeDef)
      }, []) ?? []
    acc.push({ ...variable, options })
    return acc
  }, [])
  const variablesOptions = variablesForLevel.reduce((acc, variable) => {
    acc.push(...(variable.options ?? []))
    return acc
  }, [])
  const selectedVariable = variablesOptions.find((variable) => variable.uuid === selectedAttributeUuid)

  return (
    <FormItem
      key={levelUuid}
      label={i18n.t(hierarchicalCategory ? 'nodeDefEdit.filterVariableForLevel' : 'nodeDefEdit.filterVariable', {
        levelName: CategoryLevel.getName(level),
      })}
    >
      <Dropdown
        className="identifier"
        disabled={disabled}
        items={variablesForLevel}
        onChange={(item) => onChange(item?.uuid)}
        selection={selectedVariable}
      />
    </FormItem>
  )
}

CategoryLevelVariable.propTypes = {
  disabled: PropTypes.bool,
  hierarchicalCategory: PropTypes.bool,
  level: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
  selectedAttributeUuid: PropTypes.string,
  variables: PropTypes.array.isRequired,
}

export const CallCategoryItemProp = (props) => {
  const { onConfirm: onConfirmProp, variables } = props

  const i18n = useI18n()
  const survey = useSurvey()

  const [state, setState] = useState({
    categoryUuid: null,
    extraPropKey: null,
    attributeUuidsByLevelUuid: {},
  })

  const { categoryUuid, extraPropKey, attributeUuidsByLevelUuid } = state

  const category = Survey.getCategoryByUuid(categoryUuid)(survey)
  const categoryLevels = useMemo(() => Category.getLevelsArray(category), [category])

  const buildCategoryItemPropCall = useCallback(() => {
    const params = [
      Expression.newLiteral(Strings.quote(Category.getName(category))),
      Expression.newLiteral(Strings.quote(extraPropKey)),
    ]
    const attributeUuids = Object.values(attributeUuidsByLevelUuid)
    const attributes = Survey.getNodeDefsByUuids(attributeUuids)(survey)
    params.push(...attributes.map((attrDef) => Expression.newIdentifier(NodeDef.getName(attrDef))))
    return Expression.newCall({ callee: Expression.functionNames.categoryItemProp, params })
  }, [attributeUuidsByLevelUuid, category, extraPropKey, survey])

  const onConfirm = useCallback(
    () => onConfirmProp(buildCategoryItemPropCall()),
    [buildCategoryItemPropCall, onConfirmProp]
  )

  const applyButtonDisabled = !category || !extraPropKey || Objects.isEmpty(attributeUuidsByLevelUuid)

  return (
    <div className="call-category-item-prop">
      <FormItem label={i18n.t('nodeDefEdit.codeProps.category')}>
        <CategorySelector
          categoryUuid={categoryUuid}
          filterFunction={Category.hasExtraDefs}
          onChange={(item) => {
            setState((statePrev) => ({
              ...statePrev,
              categoryUuid: Category.getUuid(item),
              extraPropKey: null,
              attributeUuidsByLevelUuid: {},
            }))
          }}
          showAdd={false}
          showEdit={false}
          showManage={false}
        />
      </FormItem>
      <FormItem label={i18n.t('extraProp.label')}>
        <Dropdown
          disabled={!categoryUuid}
          items={Category.getItemExtraDefKeys(category)}
          itemLabel={(item) => item}
          itemValue={(item) => item}
          onChange={(item) => {
            setState((statePrev) => ({
              ...statePrev,
              extraPropKey: item,
            }))
          }}
          selection={extraPropKey}
        />
      </FormItem>
      {categoryLevels.map((level, index) => {
        const levelUuid = CategoryLevel.getUuid(level)
        const selectedAttributeUuid = attributeUuidsByLevelUuid[levelUuid]
        const previousLevelUuid = index > 0 ? CategoryLevel.getUuid(categoryLevels[index - 1]) : null
        const previousLevelSelectedAttributeUuid = attributeUuidsByLevelUuid[previousLevelUuid]
        return (
          <CategoryLevelVariable
            key={levelUuid}
            disabled={!extraPropKey || (index > 0 && !previousLevelSelectedAttributeUuid)}
            hierarchicalCategory={categoryLevels.length > 1}
            level={level}
            onChange={(attributeDefUuid) => {
              setState((statePrev) => ({
                ...statePrev,
                attributeUuidsByLevelUuid: {
                  ...attributeUuidsByLevelUuid,
                  [levelUuid]: attributeDefUuid,
                },
              }))
            }}
            selectedAttributeUuid={selectedAttributeUuid}
            variables={variables}
          />
        )
      })}
      <Button disabled={applyButtonDisabled} label="common.apply" onClick={onConfirm} />
    </div>
  )
}

CallCategoryItemProp.propTypes = {
  onConfirm: PropTypes.func.isRequired,
  variables: PropTypes.array.isRequired,
}
