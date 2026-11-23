import { useCallback, useMemo, useState } from 'react'

import { Objects, Strings } from '@openforis/arena-core'

import * as A from '@core/arena'
import * as Expression from '@core/expressionParser/expression'
import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Category from '@core/survey/category'
import * as CategoryLevel from '@core/survey/categoryLevel'
import * as StringUtils from '@core/stringUtils'

import { Button } from '@webapp/components/buttons'
import { Dropdown } from '@webapp/components/form'
import { FormItem } from '@webapp/components/form/Input'
import { CategorySelector } from '@webapp/components/survey/CategorySelector'
import { useSurvey } from '@webapp/store/survey'
import { useCategoryByName, useNodeDefsByNames } from '@webapp/store/survey/hooks'

import type { CallEditorProps } from './callEditorProps'
import type { ArenaCategoryLevel } from '@openforis/arena-core'

type CategoryLevelVariableProps = {
  disabled?: boolean
  hierarchicalCategory?: boolean
  level: ArenaCategoryLevel
  onChange: (...args: any[]) => any
  selectedAttributeUuid?: string
  variables: any[]
}

const CategoryLevelVariable = (props: CategoryLevelVariableProps) => {
  const { disabled, hierarchicalCategory, level, onChange, selectedAttributeUuid, variables } = props

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
      label={hierarchicalCategory ? 'nodeDefEdit:filterVariableForLevel' : 'nodeDefEdit:filterVariable'}
      labelParams={{ levelName: CategoryLevel.getName(level) }}
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

const createInitialState = ({ initialCategory, initialCategoryPropKey, initialAttributeDefs }) => {
  const initialAttributeUuidsByLevelUuid: Record<string, string> = {}
  for (const [index, level] of Category.getLevelsArray(initialCategory).entries()) {
    initialAttributeUuidsByLevelUuid[CategoryLevel.getUuid(level)] = NodeDef.getUuid(initialAttributeDefs[index])
  }

  return {
    categoryUuid: Category.getUuid(initialCategory),
    extraPropKey: initialCategoryPropKey,
    attributeUuidsByLevelUuid: initialAttributeUuidsByLevelUuid,
  }
}

export const CallCategoryItemPropEditor = (props: CallEditorProps) => {
  const { expressionNode, onConfirm: onConfirmProp, variables } = props

  const survey = useSurvey()

  const expressionArgumentsValues =
    expressionNode?.arguments?.map((arg) => arg.value ?? arg.name).map(StringUtils.unquote) ?? []
  const [initialCategoryName, initialCategoryPropKey, ...initialAttributeNames] = expressionArgumentsValues

  const initialCategory = useCategoryByName(initialCategoryName)
  const initialAttributeDefs = useNodeDefsByNames(initialAttributeNames)

  const initialState = createInitialState({ initialCategory, initialCategoryPropKey, initialAttributeDefs })
  const [state, setState] = useState(initialState)

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

  const onCategorySelect = useCallback(
    (item) => {
      const categoryUuidNext = Category.getUuid(item)
      if (categoryUuid === categoryUuidNext) return

      setState((statePrev) => ({
        ...statePrev,
        categoryUuid: categoryUuidNext,
        extraPropKey: null,
        attributeUuidsByLevelUuid: {},
      }))
    },
    [categoryUuid]
  )

  const onConfirm = useCallback(
    () => onConfirmProp(buildCategoryItemPropCall()),
    [buildCategoryItemPropCall, onConfirmProp]
  )

  const applyButtonDisabled = !category || !extraPropKey || Objects.isEmpty(attributeUuidsByLevelUuid)

  return (
    <div className="function-editor">
      <FormItem label="nodeDefEdit:codeProps.category">
        <CategorySelector
          categoryUuid={categoryUuid}
          filterFunction={Category.hasExtraDefs}
          onChange={onCategorySelect}
          showAdd={false}
          showEdit={false}
          showManage={false}
        />
      </FormItem>
      <FormItem label="extraProp.label">
        <Dropdown
          disabled={!categoryUuid}
          items={Category.getItemExtraDefKeys(category)}
          itemLabel={A.identity}
          itemValue={A.identity}
          onChange={(item) => {
            setState((statePrev) => ({ ...statePrev, extraPropKey: item }))
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
