import * as SideBarState from './appSidebarState'

export const appSideBarOpenedUpdate = 'app/sideBar/opened/update'

export const toggleSideBar = () => (dispatch, getState) => {
  const sideBarOpened = !SideBarState.isSideBarOpened(getState())
  dispatch({ type: appSideBarOpenedUpdate, [SideBarState.keys.sideBarOpened]: sideBarOpened })
}
