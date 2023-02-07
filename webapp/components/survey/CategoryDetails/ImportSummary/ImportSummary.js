import './ImportSummary.scss'

import React from 'react'
import PropTypes from 'prop-types'

import * as CategoryImportSummary from '@core/survey/categoryImportSummary'

import { Modal, ModalBody, ModalFooter } from '@webapp/components/modal'

import TableHeader from './TableHeader'
import TableRow from './TableRow'

import { State, useActions } from '../store'
import { Button } from '@webapp/components/buttons'

const ImportSummary = (props) => {
  const { state, setState } = props

  const Actions = useActions({ setState })

  const importSummary = State.getImportSummary(state)
  const items = CategoryImportSummary.getItems(importSummary)

  return (
    <Modal className="category__import-summary" onClose={Actions.hideImportSummary}>
      <ModalBody>
        <div className="table">
          <div className="table__content">
            <TableHeader />
            <div className="table__rows">
              {items.map((item, idx) => {
                const key = CategoryImportSummary.getItemKey(item)
                return (
                  <TableRow
                    key={key}
                    idx={idx}
                    item={item}
                    onDataTypeChange={(dataType) => Actions.setImportSummaryColumnDataType({ key, dataType })}
                  />
                )
              })}
            </div>
          </div>
        </div>
      </ModalBody>

      <ModalFooter>
        <Button
          className="modal-footer__item"
          onClick={() => Actions.importCategory({ state })}
          iconClassName="icon-upload2 icon-12px"
          label="common.import"
        />
        <Button
          className="btn-close modal-footer__item"
          onClick={Actions.hideImportSummary}
          iconClassName="icon-cross icon-10px"
          label="common.close"
        />
      </ModalFooter>
    </Modal>
  )
}

ImportSummary.propTypes = {
  state: PropTypes.object.isRequired,
  setState: PropTypes.func.isRequired,
}

export default ImportSummary
