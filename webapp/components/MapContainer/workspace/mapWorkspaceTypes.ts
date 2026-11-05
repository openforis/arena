import type { ReactNode } from 'react'

export type MapWorkspaceVariant = 'full' | 'compact'
export type MapRailTabKey = 'layers' | 'records' | 'scenes' | 'legend'
export type MapToolKey = 'measureDistance' | 'measureArea'
export type MapDialogKey = 'wms' | 'screenshot'

export type MapWorkspaceState = {
  railTab: MapRailTabKey | null
  activeTool: MapToolKey | null
  dialog: MapDialogKey | null
}

export type MapWorkspaceAction =
  | { type: 'openRailTab'; tab: MapRailTabKey }
  | { type: 'toggleRailTab'; tab: MapRailTabKey }
  | { type: 'closeRail' }
  | { type: 'startTool'; tool: MapToolKey }
  | { type: 'toggleTool'; tool: MapToolKey }
  | { type: 'endTool' }
  | { type: 'openDialog'; dialog: MapDialogKey }
  | { type: 'closeDialog' }

export type MapRailTab = {
  key: MapRailTabKey
  labelKey: string // i18n key of the tab button
  titleKey?: string // i18n key of the panel title, default labelKey
  iconClassName: string // icomoon class, e.g. 'icon-stack'
  width?: number // panel width in px, default 288
  content: ReactNode
}

export type MapRecordCandidate = { id: string; label: string; lat: number; lng: number }

export type MapWorkspaceRecords = {
  candidates: MapRecordCandidate[]
  onSelect: (id: string) => void
}
