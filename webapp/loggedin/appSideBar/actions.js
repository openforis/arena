import * as SideBarState from './appSidebarState'

export const appSideBarOpenedUpdate = 'app/sideBar/opened/update'

export const toggleSideBar = () => (dispatch, getState) => {
  const sideBarOpened = !SideBarState.isOpened(getState())
  dispatch({
    type: appSideBarOpenedUpdate,
    [SideBarState.keys.opened]: sideBarOpened,
  })
}
