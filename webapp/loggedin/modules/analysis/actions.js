import { appModuleUri, analysisModules } from '@webapp/app/appModules'

export const navigateToNodeDefEdit = (history, nodeDefUuid) => () => {
  history.push(`${appModuleUri(analysisModules.nodeDef)}${nodeDefUuid}/`)
}
