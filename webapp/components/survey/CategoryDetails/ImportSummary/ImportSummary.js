import './ImportSummary.scss'

import React from 'react'
import PropTypes from 'prop-types'

import * as CategoryImportSummary from '@core/survey/categoryImportSummary'

import { Button } from '@webapp/components/buttons'
import { Modal, ModalBody, ModalFooter } from '@webapp/components/modal'

import { State, useActions } from '../store'

import TableHeader from './TableHeader'
import TableRow from './TableRow'

const ImportSummary = (props) => {
  const { state, setState } = props

  const Actions = useActions({ setState })

  const importSummary = State.getImportSummary(state)
  const items = CategoryImportSummary.getItems(importSummary)

  return (
    <Modal
      className="category__import-summary"
      onClose={Actions.hideImportSummary}
      showCloseButton
      title="categoryEdit.importSummary.title"
    >
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
      </ModalFooter>
    </Modal>
  )
}

ImportSummary.propTypes = {
  state: PropTypes.object.isRequired,
  setState: PropTypes.func.isRequired,
}

export default ImportSummary
