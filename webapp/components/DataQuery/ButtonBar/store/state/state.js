const keys = {
  panels: 'panels',
}

const keysPanels = {
  queries: 'queries',
  export: 'export',
  ai: 'ai',
}

// ====== CREATE
export const create = () => ({
  [keys.panels]: {
    [keysPanels.queries]: false,
    [keysPanels.export]: false,
    [keysPanels.ai]: false,
  },
})

// ====== READ
const isPanelShown = (panel) => (state) => state[keys.panels][panel] === true
export const isPanelQueriesShown = isPanelShown(keysPanels.queries)
export const isPanelExportShown = isPanelShown(keysPanels.export)
export const isPanelAiShown = isPanelShown(keysPanels.ai)

// ====== UPDATE
const togglePanel = (panel) => (state) => ({
  [keys.panels]: {
    ...create()[keys.panels], // close all panels
    [panel]: !state[keys.panels][panel], // toggle panel
  },
})
export const togglePanelQueries = togglePanel(keysPanels.queries)
export const togglePanelExport = togglePanel(keysPanels.export)
export const togglePanelAi = togglePanel(keysPanels.ai)
