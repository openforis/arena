import React from 'react'
import PropTypes from 'prop-types'

import * as A from '@core/arena'
import * as Category from '@core/survey/category'
import * as CategoryImportSummary from '@core/survey/categoryImportSummary'
import * as Languages from '@core/app/languages'

import { useI18n } from '@webapp/store/system'
import Dropdown from '@webapp/components/form/Dropdown'

const TableRow = (props) => {
  const { column, columnName, idx, onDataTypeChange } = props

  const i18n = useI18n()

  let columnSummaryKey = null
  if (CategoryImportSummary.hasColumnLang(column)) {
    columnSummaryKey = 'categoryEdit.importSummary.columnTypeSummaryWithLanguage'
  } else if (CategoryImportSummary.isColumnExtra(column)) {
    columnSummaryKey = 'categoryEdit.importSummary.columnTypeSummaryExtra'
  } else {
    columnSummaryKey = 'categoryEdit.importSummary.columnTypeSummary'
  }

  const dataType = CategoryImportSummary.getColumnDataType(column)

  return (
    <div className="table__row">
      <div>{idx + 1}</div>
      <div>{columnName}</div>
      <div>
        {i18n.t(columnSummaryKey, {
          type: CategoryImportSummary.getColumnType(column),
          level: CategoryImportSummary.getColumnLevelIndex(column) + 1,
          language: Languages.getLanguageLabel(CategoryImportSummary.getColumnLang(column), i18n.lang),
        })}
      </div>
      <div>
        {CategoryImportSummary.isColumnExtra(column) && (
          <Dropdown
            readOnlyInput
            items={Object.keys(Category.itemExtraDefDataTypes)}
            itemKey={A.identity}
            itemLabel={(item) => i18n.t(`categoryEdit.importSummary.columnDataType.${item}`)}
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
