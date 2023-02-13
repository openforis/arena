import React from 'react'
import PropTypes from 'prop-types'

import * as A from '@core/arena'
import { ExtraPropDef } from '@core/survey/extraPropDef'
import * as CategoryImportSummary from '@core/survey/categoryImportSummary'
import * as Languages from '@core/app/languages'

import Dropdown from '@webapp/components/form/Dropdown'

import { useI18n } from '@webapp/store/system'

const _getColumnSummaryKey = ({ item }) => {
  if (CategoryImportSummary.isItemLabel(item)) {
    return 'categoryEdit.importSummary.columnTypeLabel'
  }
  if (CategoryImportSummary.isItemDescription(item)) {
    return 'categoryEdit.importSummary.columnTypeDescription'
  }
  if (CategoryImportSummary.isItemExtra(item)) {
    return 'categoryEdit.importSummary.columnTypeExtra'
  }
  return 'categoryEdit.importSummary.columnTypeSummary'
}

const TableRow = (props) => {
  const { idx, item, onDataTypeChange } = props

  const i18n = useI18n()

  const columnSummaryKey = _getColumnSummaryKey({ item })
  const columns = CategoryImportSummary.getItemColumns(item)

  const dataType = CategoryImportSummary.getItemDataType(item)
  const itemLangCode = CategoryImportSummary.getItemLang(item)
  const language = Languages.getLanguageLabel(itemLangCode)

  return (
    <div className="table__row">
      <div>{idx + 1}</div>
      <div>{columns.join(', ')}</div>
      <div>
        {i18n.t(columnSummaryKey, {
          type: CategoryImportSummary.getItemType(item),
          level: CategoryImportSummary.getItemLevelIndex(item) + 1,
          language,
        })}
      </div>
      <div className="column__extra-def">
        {CategoryImportSummary.isItemExtra(item) && (
          <Dropdown
            className="dropdown__extra-def-type"
            disabled={CategoryImportSummary.isItemDataTypeReadOnly(item)}
            items={Object.keys(ExtraPropDef.dataTypes)}
            itemValue={A.identity}
            itemLabel={(item) => i18n.t(`extraProp.dataTypes.${item}`)}
            searchable={false}
            selection={dataType}
            onChange={onDataTypeChange}
          />
        )}
      </div>
    </div>
  )
}

TableRow.propTypes = {
  idx: PropTypes.number.isRequired,
  item: PropTypes.object.isRequired,
  onDataTypeChange: PropTypes.func.isRequired,
}

export default TableRow
