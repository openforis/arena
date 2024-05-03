const keys = {
  panels: 'panels',
}

const keysPanels = {
  filter: 'filter',
  sort: 'sort',
  queries: 'queries',
  export: 'export',
}

// ====== CREATE
export const create = () => ({
  [keys.panels]: {
    [keysPanels.filter]: false,
    [keysPanels.sort]: false,
    [keysPanels.queries]: false,
    [keysPanels.export]: false,
  },
})

// ====== READ
const isPanelShown = (panel) => (state) => state[keys.panels][panel] === true
export const isPanelFilterShown = isPanelShown(keysPanels.filter)
export const isPanelSortShow = isPanelShown(keysPanels.sort)
export const isPanelQueriesShown = isPanelShown(keysPanels.queries)
export const isPanelExportShown = isPanelShown(keysPanels.export)

// ====== UPDATE
const togglePanel = (panel) => (state) => ({
  [keys.panels]: {
    ...create()[keys.panels], // close all panels
    [panel]: !state[keys.panels][panel], // toggle panel
  },
})
export const togglePanelFilter = togglePanel(keysPanels.filter)
export const togglePanelSort = togglePanel(keysPanels.sort)
export const togglePanelQueries = togglePanel(keysPanels.queries)
export const togglePanelExport = togglePanel(keysPanels.export)
