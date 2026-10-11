import React, { useMemo } from 'react'
import type { ReactElement } from 'react'

import * as User from '@core/user/user'
import { useSystemConfigExperimentalFeatures } from '@webapp/store/system'
import { useUser } from '@webapp/store/user'

import { baseLayers } from '../../baseLayers'
import { useMapContextBaseLayer } from '../../MapContext'
import { useMapContextActions } from '../mapContextActions'
import { getSelectableBaseLayers } from './baseMapItems'
import type { SelectableBaseLayerDef } from './baseMapItems'
import { MenuRadioItem } from './menuItems'
import { ToolbarMenu } from './ToolbarMenu'

/**
 * Base map menu: one choice per base layer the user can use.
 * @returns {React.ReactElement} The menu.
 */
export const BaseMapMenu = (): ReactElement => {
  const user = useUser()
  const experimentalFeaturesEnabled = useSystemConfigExperimentalFeatures()
  const { onBaseLayerUpdate } = useMapContextActions()
  const currentBaseLayer = useMapContextBaseLayer() as SelectableBaseLayerDef

  const selectableBaseLayers = useMemo(
    () =>
      getSelectableBaseLayers({
        baseLayers: baseLayers as unknown as SelectableBaseLayerDef[],
        experimentalFeaturesEnabled: Boolean(experimentalFeaturesEnabled),
        hasApiKey: (provider) => Boolean(User.getMapApiKey({ provider })(user)),
      }),
    [experimentalFeaturesEnabled, user]
  )

  return (
    <ToolbarMenu menuKey="baseMap" labelKey="mapWorkspace.menus.baseMap" iconClassName="icon-map2">
      {(close) =>
        selectableBaseLayers.map((baseLayer) => (
          <MenuRadioItem
            key={baseLayer.key}
            itemKey={`baseMap-${baseLayer.key}`}
            label={baseLayer.name}
            checked={baseLayer.key === currentBaseLayer?.key}
            onSelect={() => {
              onBaseLayerUpdate(baseLayer)
              close()
            }}
          />
        ))
      }
    </ToolbarMenu>
  )
}
