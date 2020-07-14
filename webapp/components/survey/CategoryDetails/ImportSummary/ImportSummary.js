import './ImportSummary.scss'

import React from 'react'
import PropTypes from 'prop-types'

import * as Category from '@core/survey/category'
import * as CategoryImportSummary from '@core/survey/categoryImportSummary'

import { useI18n } from '@webapp/store/system'
import { Modal, ModalBody, ModalFooter } from '@webapp/components/modal'

import TableHeader from './TableHeader'
import TableRow from './TableRow'

import { State, useActions } from '../store'

const ImportSummary = (props) => {
  const { state, setState } = props

  const i18n = useI18n()

  const Actions = useActions({ setState })

  const category = State.getCategory(state)
  const importSummary = State.getImportSummary(state)
  const columns = CategoryImportSummary.getColumns(importSummary)

  return (
    <Modal className="category__import-summary" onClose={Actions.hideImportSummary}>
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
                  onDataTypeChange={(dataType) => Actions.setImportSummaryColumnDataType({ columnName, dataType })}
                />
              ))}
            </div>
          </div>
        </div>
      </ModalBody>

      <ModalFooter>
        <button
          type="button"
          className="btn modal-footer__item"
          onClick={() => Actions.importCategory({ categoryUuid: Category.getUuid(category), importSummary })}
        >
          <span className="icon icon-upload2 icon-12px icon-left" />
          {i18n.t('common.import')}
        </button>
        <button type="button" className="btn btn-close modal-footer__item" onClick={Actions.hideImportSummary}>
          <span className="icon icon-cross icon-10px icon-left" />
          {i18n.t('common.close')}
        </button>
      </ModalFooter>
    </Modal>
  )
}

ImportSummary.propTypes = {
  state: PropTypes.object.isRequired,
  setState: PropTypes.func.isRequired,
}

export default ImportSummary
