import React from 'react'
import PropTypes from 'prop-types'

import * as A from '@core/arena'
import { ExtraPropDef } from '@core/survey/extraPropDef'
import * as CategoryImportSummary from '@core/survey/categoryImportSummary'
import * as Languages from '@core/app/languages'

import Dropdown from '@webapp/components/form/Dropdown'

import { useI18n } from '@webapp/store/system'

const _getColumnSummaryKey = ({ column }) => {
  if (CategoryImportSummary.isItemLabel(column)) {
    return 'categoryEdit.importSummary.columnTypeLabel'
  }
  if (CategoryImportSummary.isItemDescription(column)) {
    return 'categoryEdit.importSummary.columnTypeDescription'
  }
  if (CategoryImportSummary.isItemExtra(column)) {
    return 'categoryEdit.importSummary.columnTypeSummaryExtra'
  }

  return 'categoryEdit.importSummary.columnTypeSummary'
}

const TableRow = (props) => {
  const { column, columnName, idx, onDataTypeChange } = props

  const i18n = useI18n()

  const columnSummaryKey = _getColumnSummaryKey({ column })

  const dataType = CategoryImportSummary.getItemDataType(column)

  return (
    <div className="table__row">
      <div>{idx + 1}</div>
      <div>{columnName}</div>
      <div>
        {i18n.t(columnSummaryKey, {
          type: CategoryImportSummary.getItemType(column),
          level: CategoryImportSummary.getItemLevelIndex(column) + 1,
          language: Languages.getLanguageLabel(CategoryImportSummary.getItemLang(column), i18n.language),
        })}
      </div>
      <div className="column__extra-def">
        {CategoryImportSummary.isItemExtra(column) && (
          <Dropdown
            className="dropdown__extra-def-type"
            items={Object.keys(ExtraPropDef.dataTypes)}
            itemValue={A.identity}
            itemLabel={(item) => i18n.t(`extraProp.dataTypes.${item}`)}
            searchable={false}
            selection={dataType}
            onChange={(item) => onDataTypeChange(item)}
          />
        )}
      </div>
    </div>
  )
}

TableRow.propTypes = {
  column: PropTypes.object.isRequired,
  columnName: PropTypes.string.isRequired,
  idx: PropTypes.number.isRequired,
  onDataTypeChange: PropTypes.func.isRequired,
}

export default TableRow
