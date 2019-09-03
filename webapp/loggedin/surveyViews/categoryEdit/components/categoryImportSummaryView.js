import './categoryImportSummaryView.scss'

import React from 'react'
import { connect } from 'react-redux'

import useI18n from '../../../../commonComponents/useI18n'
import Dropdown from '../../../../commonComponents/form/dropdown'

import CategoryImportSummary from '../../../../../common/survey/categoryImportSummary'
import Languages from '../../../../../common/app/languages'

import { importCategory, hideCategoryImportSummary, setCategoryImportSummaryColumnDataType } from '../actions'

const TableHeader = () => {
  const i18n = useI18n()

  return (
    <div className="category-edit__import-summary table__row-header ">
      <div>#</div>
      <div>{i18n.t('categoryEdit.importSummary.column')}</div>
      <div>{i18n.t('common.type')}</div>
      <div>{i18n.t('categoryEdit.importSummary.dataType')}</div>
      <div/>
    </div>
  )
}

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
      <div>{
        i18n.t(columnSummaryKey, {
          type: CategoryImportSummary.getColumnType(column),
          level: CategoryImportSummary.getColumnLevelIndex(column) + 1,
          language: Languages.getLanguageLabel(CategoryImportSummary.getColumnLang(column), i18n.lang),
        })
      }</div>
      <div>{CategoryImportSummary.isColumnExtra(column) && (
        <Dropdown
          readOnlyInput={true}
          items={Object.keys(CategoryImportSummary.columnDataTypes)}
          itemLabelFunction={dataType => i18n.t(`categoryEdit.importSummary.columnDataType.${dataType}`)}
          selection={dataType}
          onChange={dataType => setCategoryImportSummaryColumnDataType(columnName, dataType)}
        />
      )
      }
      </div>
    </div>
  )
}

const TableRows = ({ columns, setCategoryImportSummaryColumnDataType }) => (
  <div className="table__rows">
    {
      Object.entries(columns).map(([columnName, column], idx) =>
        <TableRow
          key={columnName}
          idx={idx}
          columnName={columnName}
          column={column}
          setCategoryImportSummaryColumnDataType={setCategoryImportSummaryColumnDataType}
        />
      )
    }
  </div>
)

const CategoryImportSummaryView = props => {
  const {
    summary,
    importCategory, hideCategoryImportSummary, setCategoryImportSummaryColumnDataType
  } = props

  const i18n = useI18n()

  const columns = CategoryImportSummary.getColumns(summary)

  return (
    <div className="category-edit__import-summary">
      <div className="table">
        <TableHeader/>
        <div className="table__content">
          <TableRows
            columns={columns}
            setCategoryImportSummaryColumnDataType={setCategoryImportSummaryColumnDataType}
          />
        </div>
      </div>
      <div className="category-edit__import-summary-footer">
        <button className="btn"
                onClick={() => importCategory()}>
          {i18n.t('common.import')}
        </button>
        <button className="btn btn-close"
                onClick={() => hideCategoryImportSummary()}>
          {i18n.t('common.close')}
        </button>
      </div>

    </div>
  )
}

export default connect(
  null,
  {
    hideCategoryImportSummary,
    importCategory,
    setCategoryImportSummaryColumnDataType
  }
)(CategoryImportSummaryView)
