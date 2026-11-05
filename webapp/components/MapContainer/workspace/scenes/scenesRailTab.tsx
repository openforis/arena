import React from 'react'

import type { MapRailTab } from '@webapp/components/MapContainer/workspace/mapWorkspaceTypes'

import { ScenesPanel } from './ScenesPanel'

// Wider than the default 288 px: the row actions and the month chart need the room.
export const scenesRailTab: MapRailTab = {
  key: 'scenes',
  labelKey: 'mapWorkspace.scenes.tab',
  titleKey: 'mapWorkspace.scenes.title',
  iconClassName: 'icon-earth',
  width: 340,
  content: <ScenesPanel />,
}
