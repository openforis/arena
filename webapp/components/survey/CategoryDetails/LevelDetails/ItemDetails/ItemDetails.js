import './itemDetails.scss'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import classNames from 'classnames'
import PropTypes from 'prop-types'
import ErrorRounded from '@mui/icons-material/ErrorRounded'
import ExpandMore from '@mui/icons-material/ExpandMore'

import * as Category from '@core/survey/category'
import * as CategoryLevel from '@core/survey/categoryLevel'
import * as CategoryItem from '@core/survey/categoryItem'
import * as Validation from '@core/validation/validation'

import { Button, ButtonDelete } from '@webapp/components'
import ErrorBadge from '@webapp/components/errorBadge'
import { FormItem, Input } from '@webapp/components/form/Input'
import LabelsEditor from '@webapp/components/survey/LabelsEditor'

import { useAuthCanEditSurvey } from '@webapp/store/user'
import { useSurveyPreferredLang } from '@webapp/store/survey'
import { TestId } from '@webapp/utils/testId'

import { State, useActions } from '../../store'
import { ItemExtraPropsEditor } from './ItemExtraPropsEditor'

const ItemDetails = (props) => {
  const { level, index, item: itemProp, state, setState } = props

  const elemRef = useRef(null)
  const isInitialMount = useRef(true)

  const readOnly = !useAuthCanEditSurvey()
  const lang = useSurveyPreferredLang()

  const [item, setItem] = useState(itemProp)

  const category = State.getCategory(state)
  const categoryUuid = useMemo(() => Category.getUuid(category), [category])
  const itemExtraDefsArray = Category.getItemExtraDefsArray(category)
  const validation = Category.getItemValidation(item)(category)
  const valid = Validation.isValid(validation)
  const { published: disabled } = item
  const code = CategoryItem.getCode(item)
  const label = CategoryItem.getLabel(lang, false)(item)

  const levelIndex = useMemo(() => CategoryLevel.getIndex(level), [level])
  const levelIsLast = levelIndex === Category.getLevelsArray(category).length - 1
  const itemActive = State.getItemActive({ levelIndex })(state)
  const itemActiveUuid = itemActive ? CategoryItem.getUuid(itemActive) : null
  const itemUuid = useMemo(() => CategoryItem.getUuid(item), [item])
  const active = itemUuid === itemActiveUuid
  const leaf = active && State.isItemActiveLeaf({ levelIndex })(state)
  const extraPropsEditorVisible =
    itemExtraDefsArray.length > 0 &&
    (levelIsLast || !Category.isReportingData(category) || itemExtraDefsArray.length > 1)

  const Actions = useActions({ setState })
  const { setItemActive, resetItemActive } = Actions

  const updateProp = useCallback(
    ({ key, value }) => {
      setItem(CategoryItem.assocProp({ key, value }))
      Actions.updateItemProp({ categoryUuid, levelIndex, itemUuid, key, value })
    },
    [Actions, categoryUuid, itemUuid, levelIndex]
  )

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false
      if (active) {
        elemRef.current.scrollIntoView(false)
      }
    }
  }, [active])

  // Update item when itemProp changes (e.g. after saving the item or when another item is selected)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- keeps the local item in sync with the item prop
    setItem(itemProp)
  }, [itemProp])

  const moveItem = useCallback(
    ({ offset }) => {
      Actions.moveItem({ setItem, category, level, item, offset })
    },
    [Actions, category, item, level]
  )

  const onMoveUpClick = useCallback(() => moveItem({ offset: -1 }), [moveItem])

  const onMoveDownClick = useCallback(() => moveItem({ offset: 1 }), [moveItem])

  const onDeleteClick = useCallback(
    () => Actions.deleteItem({ category, level, item, leaf }),
    [Actions, category, item, leaf, level]
  )

  const prefixId = `category-level-${levelIndex}-item-${index}`

  const toggleActive = useCallback(() => {
    if (active) {
      resetItemActive({ levelIndex })
    } else {
      setItemActive({ categoryUuid, levelIndex, itemUuid })
    }
  }, [active, categoryUuid, itemUuid, levelIndex, resetItemActive, setItemActive])

  const onHeaderKeyDown = useCallback(
    (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        toggleActive()
      }
    },
    [toggleActive]
  )

  const onToggleBtnClick = useCallback(
    (event) => {
      event.stopPropagation()
      toggleActive()
    },
    [toggleActive]
  )

  // collapse the item when clicking outside of it, unless nested levels are showing its descendants
  useEffect(() => {
    if (!active) return undefined

    const onDocumentClick = (event) => {
      const { target } = event
      const elem = elemRef.current
      const categoryElem = elem?.closest('.category')
      // ignore clicks outside of the category editor (e.g. dialogs) or inside the item itself
      if (!categoryElem?.contains(target) || elem.contains(target)) return
      if (!leaf) return
      const targetLevelElem = target.closest('.category__level')
      if (targetLevelElem && Number(targetLevelElem.dataset.levelIndex) > levelIndex) return
      resetItemActive({ levelIndex, itemUuid })
    }
    document.addEventListener('click', onDocumentClick)
    return () => document.removeEventListener('click', onDocumentClick)
  }, [active, itemUuid, leaf, levelIndex, resetItemActive])

  return (
    <div
      id={prefixId}
      data-testid={TestId.categoryDetails.item(levelIndex, index)}
      className={classNames('category__item', { active, 'not-valid': !valid })}
      key={CategoryItem.getUuid(item)}
      ref={elemRef}
    >
      <div
        className="category__item-header"
        onClick={toggleActive}
        onKeyDown={onHeaderKeyDown}
        role="button"
        tabIndex={0}
        aria-expanded={active}
      >
        {!valid && (
          <ErrorBadge
            className="error-badge-inverse"
            id={TestId.categoryDetails.itemErrorBadge(levelIndex, index)}
            validation={validation}
            showLabel={false}
          >
            <ErrorRounded
              className={classNames('category__item-error-icon', {
                warning: !Validation.isError(validation) && Validation.isWarning(validation),
              })}
            />
          </ErrorBadge>
        )}
        <div className="category__item-index">#{index + 1}</div>
        <div className={classNames('ellipsis', 'category__item-code', { empty: !code })}>{code || '---'}</div>
        <div className={classNames('ellipsis', 'category__item-label', { empty: !label })}>{label || '---'}</div>
        <Button
          id={`${prefixId}-btn-toggle`}
          testId={active ? TestId.categoryDetails.itemCloseBtn(levelIndex, index) : null}
          className="category__item-toggle-btn"
          icon={<ExpandMore className="category__item-toggle-icon" />}
          onClick={onToggleBtnClick}
          size="small"
          tabIndex={-1}
          variant="text"
        />
      </div>

      {active && (
        <div className="category__item-body">
          <FormItem label="common.code">
            <Input
              autoFocus
              id={TestId.categoryDetails.itemCode(levelIndex, index)}
              value={CategoryItem.getCode(item)}
              disabled={disabled}
              validation={Validation.getFieldValidation(CategoryItem.keysProps.code)(validation)}
              onChange={(value) =>
                updateProp({ key: CategoryItem.keysProps.code, value: CategoryItem.normalizeCode(value) })
              }
              readOnly={readOnly}
            />
          </FormItem>

          <LabelsEditor
            inputFieldIdPrefix={TestId.categoryDetails.itemLabelPrefix(levelIndex, index)}
            labels={CategoryItem.getLabels(item)}
            onChange={(labels) => updateProp({ key: CategoryItem.keysProps.labels, value: labels })}
            readOnly={readOnly}
          />

          <LabelsEditor
            formLabelKey="common.description"
            inputFieldIdPrefix={TestId.categoryDetails.itemDescriptionPrefix(levelIndex, index)}
            inputType="textarea"
            labels={CategoryItem.getDescriptions(item)}
            onChange={(descriptions) => updateProp({ key: CategoryItem.keysProps.descriptions, value: descriptions })}
            readOnly={readOnly}
          />

          {extraPropsEditorVisible && (
            <ItemExtraPropsEditor
              item={item}
              itemExtraDefsArray={itemExtraDefsArray}
              readOnly={readOnly}
              updateProp={updateProp}
              validation={validation}
            />
          )}

          {!readOnly && (
            <div className="button-bar">
              <Button
                disabled={CategoryItem.getIndex(item) === 0}
                className="move-up-btn"
                iconClassName="icon-arrow-up2 icon-12px"
                label="common.moveUp"
                onClick={onMoveUpClick}
                variant="outlined"
              />
              <Button
                className="move-down-btn"
                iconClassName="icon-arrow-down2 icon-12px"
                label="common.moveDown"
                onClick={onMoveDownClick}
                variant="outlined"
              />
              <ButtonDelete
                testId={TestId.categoryDetails.itemDeleteBtn(levelIndex, index)}
                disabled={disabled}
                onClick={onDeleteClick}
                label="categoryEdit.deleteItem"
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

ItemDetails.propTypes = {
  level: PropTypes.object.isRequired,
  index: PropTypes.number.isRequired,
  item: PropTypes.object.isRequired,
  state: PropTypes.object.isRequired,
  setState: PropTypes.func.isRequired,
}

export default ItemDetails
