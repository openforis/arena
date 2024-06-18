import './sortEditor.scss'
import React from 'react'
import PropTypes from 'prop-types'

import { Button } from '@webapp/components/buttons'
import PanelRight from '@webapp/components/PanelRight'
import { useI18n } from '@webapp/store/system'
import { Sort, SortCriteria } from '@common/model/query'

import { useSortEditor } from './store'
import SortCriteriaEditor from './SortCriteriaEditor'

const SortEditor = (props) => {
  const { onChange, onClose, query } = props

  const i18n = useI18n()
  const { draft, sort, sortDraft, setSortDraft, variables, variablesAvailable } = useSortEditor({ query })

  return (
    <PanelRight onClose={onClose} header={i18n.t('common.orderBy')}>
      <div className="sort-editor">
        {sortDraft.map((sortCriteria, idx) => (
          <SortCriteriaEditor
            key={String(idx)}
            onChange={(sortCriteriaUpdated) =>
              setSortDraft(Sort.updateSortCriteria(idx, sortCriteriaUpdated)(sortDraft))
            }
            onDelete={() => setSortDraft(Sort.deleteSortCriteria(idx)(sortDraft))}
            sortCriteria={sortCriteria}
            variables={variables}
            variablesAvailable={variablesAvailable}
          />
        ))}

        {variablesAvailable.length > 0 && (
          <SortCriteriaEditor
            onChange={(sortCriteriaUpdated) => setSortDraft(Sort.addSortCriteria(sortCriteriaUpdated)(sortDraft))}
            sortCriteria={SortCriteria.create()}
            variables={variables}
            variablesAvailable={variablesAvailable}
            placeholder
          />
        )}

        <div className="button-bar">
          <Button
            disabled={Sort.isEmpty(sort)}
            iconClassName="icon-undo2 icon-12px"
            label="common.reset"
            onClick={() => onChange(Sort.create())}
            size="small"
          />

          <Button
            className="btn btn-s btn-primary"
            onClick={() => onChange(sortDraft)}
            disabled={!draft}
            iconClassName="icon-checkmark icon-12px"
            label="common.apply"
          />
        </div>
      </div>
    </PanelRight>
  )
}

SortEditor.propTypes = {
  onChange: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  query: PropTypes.object.isRequired,
}

export default SortEditor
