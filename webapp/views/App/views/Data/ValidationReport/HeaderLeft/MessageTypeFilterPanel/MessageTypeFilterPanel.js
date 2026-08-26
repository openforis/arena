import React, { useEffect } from 'react'
import PropTypes from 'prop-types'

import { MessageTypeFilterCategoryIds } from '@core/validation/messageTypeFilterCategories'

import { Checkbox } from '@webapp/components/form'

const customValidationCategoryId = 'customValidation'
const otherCategoryIds = MessageTypeFilterCategoryIds.filter((categoryId) => categoryId !== customValidationCategoryId)

export const MessageTypeFilterPanel = ({
  allCategoriesSelected,
  containerRef,
  onClose,
  onSelectedCategoryIdsChange,
  selectedCategoryIds,
}) => {
  const onCategoryToggle = (categoryId, selected) => {
    const next = new Set(selectedCategoryIds)
    if (selected) {
      next.add(categoryId)
    } else {
      next.delete(categoryId)
    }
    onSelectedCategoryIdsChange([...next])
  }

  const renderCategoryCheckbox = (categoryId) => (
    <Checkbox
      key={categoryId}
      checked={selectedCategoryIds.includes(categoryId)}
      label={`dataView:messageTypeFilter.${categoryId}`}
      onChange={(selected) => onCategoryToggle(categoryId, selected)}
    />
  )

  // Close the panel when the user clicks outside of it (and outside of its toggle button).
  useEffect(() => {
    const onDocumentMouseDown = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', onDocumentMouseDown)
    return () => document.removeEventListener('mousedown', onDocumentMouseDown)
  }, [containerRef, onClose])

  return (
    <div className="validation-report__message-type-filter-panel">
      <Checkbox
        checked={allCategoriesSelected}
        className="select-all"
        indeterminate={!allCategoriesSelected && selectedCategoryIds.length > 0}
        label="common.selectAll"
        onChange={(selected) => onSelectedCategoryIdsChange(selected ? MessageTypeFilterCategoryIds : [])}
      />
      <div className="validation-report__message-type-filter-panel-divider" />
      <div className="validation-report__message-type-filter-panel-items">
        {otherCategoryIds.map(renderCategoryCheckbox)}
      </div>
      <div className="validation-report__message-type-filter-panel-divider" />
      <div className="validation-report__message-type-filter-panel-items">
        {renderCategoryCheckbox(customValidationCategoryId)}
      </div>
    </div>
  )
}

MessageTypeFilterPanel.propTypes = {
  allCategoriesSelected: PropTypes.bool.isRequired,
  containerRef: PropTypes.object.isRequired,
  onClose: PropTypes.func.isRequired,
  onSelectedCategoryIdsChange: PropTypes.func.isRequired,
  selectedCategoryIds: PropTypes.array.isRequired,
}
