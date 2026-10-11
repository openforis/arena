import type {
  MapDialogKey,
  MapRailTabKey,
  MapToolKey,
  MapWorkspaceAction,
  MapWorkspaceState,
} from './mapWorkspaceTypes'

/**
 * Creates the initial workspace state.
 * @param {MapRailTabKey|null} railTab - Rail tab open at start (null: rail closed).
 * @returns {MapWorkspaceState} The initial state.
 */
export const initialMapWorkspaceState = (railTab: MapRailTabKey | null): MapWorkspaceState => ({
  railTab,
  activeTool: null,
  dialog: null,
})

// each helper returns the same object when nothing changes, so React skips the re-render
const withRailTab = (state: MapWorkspaceState, railTab: MapRailTabKey | null): MapWorkspaceState =>
  state.railTab === railTab ? state : { ...state, railTab }

const withTool = (state: MapWorkspaceState, activeTool: MapToolKey | null): MapWorkspaceState =>
  state.activeTool === activeTool ? state : { ...state, activeTool }

const withDialog = (state: MapWorkspaceState, dialog: MapDialogKey | null): MapWorkspaceState =>
  state.dialog === dialog ? state : { ...state, dialog }

/**
 * Applies a workspace action.
 * @param {MapWorkspaceState} state - Current state.
 * @param {MapWorkspaceAction} action - Action.
 * @returns {MapWorkspaceState} The next state (the same object when nothing changes).
 */
export const mapWorkspaceReducer = (state: MapWorkspaceState, action: MapWorkspaceAction): MapWorkspaceState => {
  switch (action.type) {
    case 'openRailTab':
      return withRailTab(state, action.tab)
    case 'toggleRailTab':
      return withRailTab(state, state.railTab === action.tab ? null : action.tab)
    case 'closeRail':
      return withRailTab(state, null)
    case 'startTool':
      return withTool(state, action.tool)
    case 'toggleTool':
      return withTool(state, state.activeTool === action.tool ? null : action.tool)
    case 'endTool':
      return withTool(state, null)
    case 'openDialog':
      return withDialog(state, action.dialog)
    case 'closeDialog':
      return withDialog(state, null)
    default:
      return state
  }
}
