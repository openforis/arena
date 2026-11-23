import './sortEditor.scss'

import { Button } from '@webapp/components/buttons'
import PanelRight from '@webapp/components/PanelRight'
import { Query, Sort, SortCriteria } from '@common/model/query'

import { useSortEditor } from './store'
import SortCriteriaEditor from './SortCriteriaEditor'

type SortEditorProps = {
  onChange: (...args: any[]) => any
  onClose: (...args: any[]) => any
  query: Query.QueryItem
}

const SortEditor = (props: SortEditorProps) => {
  const { onChange, onClose, query } = props

  const { draft, sort, sortDraft, setSortDraft, variables, variablesAvailable } = useSortEditor({ query })

  return (
    <PanelRight onClose={onClose} header="common.orderBy">
      <div className="sort-editor">
        {sortDraft.map((sortCriteria, idx) => (
          <SortCriteriaEditor
            key={SortCriteria.getVariable(sortCriteria)}
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

export default SortEditor
