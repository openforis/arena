import React from 'react'

import * as Category from '@core/survey/category'
import * as CategoryImportSummary from '@core/survey/categoryImportSummary'
import * as Languages from '@core/app/languages'

import { useI18n } from '@webapp/store/system'
import Dropdown from '@webapp/components/form/Dropdown'

const TableRow = ({ idx, columnName, column, setCategoryImportSummaryColumnDataType }) => {
  const i18n = useI18n()

  const columnSummaryKey = CategoryImportSummary.hasColumnLang(column)
    ? 'categoryEdit.importSummary.columnTypeSummaryWithLanguage'
    : CategoryImportSummary.isColumnExtra(column)
    ? 'categoryEdit.importSummary.columnTypeSummaryExtra'
    : 'categoryEdit.importSummary.columnTypeSummary'

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
            readOnlyInput={true}
            items={Object.keys(Category.itemExtraDefDataTypes)}
            itemLabel={(dataType) => i18n.t(`categoryEdit.importSummary.columnDataType.${dataType}`)}
            selection={dataType}
            onChange={(dataType) => setCategoryImportSummaryColumnDataType(columnName, dataType)}
          />
        )}
      </div>
    </div>
  )
}

export default TableRow
