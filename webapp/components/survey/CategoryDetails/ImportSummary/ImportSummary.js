import './ImportSummary.scss'

import React from 'react'
import { connect } from 'react-redux'

import * as CategoryImportSummary from '@core/survey/categoryImportSummary'

import { useI18n } from '@webapp/store/system'
import { Modal, ModalBody, ModalFooter } from '@webapp/components/modal'

import TableHeader from './TableHeader'
import TableRow from './TableRow'

import {
  importCategory,
  hideCategoryImportSummary,
  setCategoryImportSummaryColumnDataType,
} from '../../../../loggedin/surveyViews/category/actions'

const ImportSummary = (props) => {
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
})(ImportSummary)
