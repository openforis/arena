const keys = {
  panels: 'panels',
}

const keysPanels = {
  filter: 'filter',
  sort: 'sort',
}

// ====== CREATE
export const create = () => ({
  [keys.panels]: {
    [keysPanels.filter]: false,
    [keysPanels.sort]: false,
  },
})

// ====== READ
const showPanel = (panel) => (state) => state[keys.panels][panel] === true
export const showPanelFilter = showPanel(keysPanels.filter)
export const showPanelSort = showPanel(keysPanels.sort)

// ====== UPDATE
const togglePanel = (panel) => (state) => ({
  [keys.panels]: {
    ...create()[keys.panels], // close all panels
    [panel]: !state[keys.panels][panel], // toggle panel
  },
})
export const togglePanelFilter = togglePanel(keysPanels.filter)
export const togglePanelSort = togglePanel(keysPanels.sort)
