import { useMemo, useState } from 'react'

import { Objects } from '@openforis/arena-core'

const sources = {
  allRecords: 'allRecords',
  filteredRecords: 'filteredRecords',
  selectedRecords: 'selectedRecords',
}

type Params = {
  recordUuids?: string[] | null
  search?: string | null
  sourceSelectionAvailable?: boolean
}

/**
 * Handles the choice of the records to export (all, selected or filtered ones).
 * @param {Params} params - The selected records, the search text and whether the source can be chosen.
 * @returns {object} - The available sources, the selected one and the related export params.
 */
export const useDataExportSource = ({ recordUuids = null, search = null, sourceSelectionAvailable = true }: Params) => {
  const [source, setSource] = useState(sources.allRecords)

  const selectedRecordsCount = recordUuids?.length ?? 0

  const availableSources = useMemo(() => {
    const _availableSources: { key: string; label: string; labelParams?: { count: number } }[] = [
      { key: sources.allRecords, label: `dataView:dataExport.source.allRecords` },
    ]
    if (sourceSelectionAvailable && selectedRecordsCount > 0) {
      _availableSources.push({
        key: sources.selectedRecords,
        label: `dataView:dataExport.source.selectedRecord`,
        labelParams: { count: selectedRecordsCount },
      })
    }
    if (sourceSelectionAvailable && !Objects.isEmpty(search)) {
      _availableSources.push({ key: sources.filteredRecords, label: `dataView:dataExport.source.filteredRecords` })
    }
    return _availableSources
  }, [search, selectedRecordsCount, sourceSelectionAvailable])

  return {
    availableSources,
    multipleSources: availableSources.length > 1,
    onSourceChange: setSource,
    source,
    sourceParams: {
      recordUuids: source === sources.selectedRecords ? recordUuids : null,
      search: source === sources.filteredRecords ? search : null,
    },
  }
}
