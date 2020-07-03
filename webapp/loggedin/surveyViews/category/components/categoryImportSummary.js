import './categoryImportSummary.scss'

import React from 'react'
import { connect } from 'react-redux'

import { useI18n } from '@webapp/store/system'
import Dropdown from '@webapp/components/form/Dropdown'
import { Modal, ModalBody, ModalFooter } from '@webapp/components/modal'

import * as Category from '@core/survey/category'
import * as CategoryImportSummary from '@core/survey/categoryImportSummary'
import * as Languages from '@core/app/languages'

import { importCategory, hideCategoryImportSummary, setCategoryImportSummaryColumnDataType } from '../actions'

const TableHeader = () => {
  const i18n = useI18n()

  return (
    <div className="table__row-header">
      <div>#</div>
      <div>{i18n.t('categoryEdit.importSummary.column')}</div>
      <div>{i18n.t('common.type')}</div>
      <div>{i18n.t('categoryEdit.importSummary.dataType')}</div>
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
            itemLabel={dataType => i18n.t(`categoryEdit.importSummary.columnDataType.${dataType}`)}
            selection={dataType}
            onChange={dataType => setCategoryImportSummaryColumnDataType(columnName, dataType)}
          />
        )}
      </div>
    </div>
  )
}

const CategoryImportSummaryView = props => {
  const { summary, importCategory, hideCategoryImportSummary, setCategoryImportSummaryColumnDataType } = props

  const i18n = useI18n()

  const columns = CategoryImportSummary.getColumns(summary)

  return (
    <Modal className="category__import-summary" onClose={hideCategoryImportSummary}>
      <ModalBody>
        <div className="table">
          <div className="table__content">
            <TableHeader />
            <div className="table__rows">
              {Object.entries(columns).map(([columnName, column], idx) => (
                <TableRow
                  key={columnName}
                  idx={idx}
                  columnName={columnName}
                  column={column}
                  setCategoryImportSummaryColumnDataType={setCategoryImportSummaryColumnDataType}
                />
              ))}
            </div>
          </div>
        </div>
      </ModalBody>

      <ModalFooter>
        <button className="btn modal-footer__item" onClick={() => importCategory()}>
          <span className="icon icon-upload2 icon-12px icon-left" />
          {i18n.t('common.import')}
        </button>
        <button className="btn btn-close modal-footer__item" onClick={() => hideCategoryImportSummary()}>
          <span className="icon icon-cross icon-10px icon-left" />
          {i18n.t('common.close')}
        </button>
      </ModalFooter>
    </Modal>
  )
}

export default connect(null, {
  hideCategoryImportSummary,
  importCategory,
  setCategoryImportSummaryColumnDataType,
})(CategoryImportSummaryView)
