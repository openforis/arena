import React, { useCallback, useMemo, useState } from 'react'
import PropTypes from 'prop-types'

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
  const { hierarchicalCategory, level, onChange, selectedAttributeUuid, variables } = props

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
        items={variablesForLevel}
        onChange={(item) => onChange(item?.uuid)}
        selection={selectedVariable}
      />
    </FormItem>
  )
}

CategoryLevelVariable.propTypes = {
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
    const params = []
    if (category) {
      params.push(Expression.newLiteral(Category.getName(category)))
      if (extraPropKey) {
        params.push(Expression.newLiteral(extraPropKey))
      }
    }
    return Expression.newCall({ callee: Expression.functionNames.categoryItemProp, params })
  }, [category, extraPropKey])

  const onConfirm = useCallback(
    () => onConfirmProp(buildCategoryItemPropCall()),
    [buildCategoryItemPropCall, onConfirmProp]
  )

  return (
    <div>
      <div>
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
            showEdit
            showManage
          />
        </FormItem>
        {categoryUuid && (
          <FormItem label={i18n.t('extraProp.label')}>
            <Dropdown
              items={Category.getItemExtraDefKeys(category)}
              itemLabel={(item) => item}
              itemValue={(item) => item}
              onChange={(item) => {
                setState((statePrev) => ({
                  ...statePrev,
                  extraPropKey: item,
                }))
              }}
              placeholder={i18n.t('extraProp.label')}
              selection={extraPropKey}
            />
          </FormItem>
        )}
        {extraPropKey &&
          categoryLevels.map((level) => {
            const levelUuid = CategoryLevel.getUuid(level)
            const selectedAttributeUuid = attributeUuidsByLevelUuid[levelUuid]
            return (
              <CategoryLevelVariable
                key={levelUuid}
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
      </div>
      <Button label="common.ok" onClick={onConfirm} primary />
    </div>
  )
}

CallCategoryItemProp.propTypes = {
  onConfirm: PropTypes.func.isRequired,
  variables: PropTypes.array.isRequired,
}
