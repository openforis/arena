import type { ReactElement, ReactNode } from 'react'

import * as Survey from '@core/survey/survey'
import { useSurveyInfo } from '@webapp/store/survey'

import { useMapContextOptions } from '../../MapContext'
import { useMapContextActions } from '../mapContextActions'
import { getDisplayMenuSections } from './displayMenuItems'
import { MenuCheckItem, MenuSectionHeader } from './menuItems'
import { ToolbarMenu } from './ToolbarMenu'

/**
 * Display menu: map options (markers, labels, UTM grid, image interpretation aids); it stays open while toggling.
 * @returns {React.ReactElement} The menu.
 */
export const DisplayMenu = (): ReactElement => {
  const surveyInfo = useSurveyInfo()
  const options = useMapContextOptions()
  const { onOptionUpdate } = useMapContextActions()
  const sections = getDisplayMenuSections({
    options,
    sampleBasedImageInterpretationEnabled: Boolean(Survey.isSampleBasedImageInterpretationEnabled(surveyInfo)),
  })

  return (
    <ToolbarMenu menuKey="display" labelKey="mapWorkspace.menus.display" iconClassName="icon-eye">
      {() =>
        sections.flatMap(({ headerKey, items }) => {
          const nodes: ReactNode[] = headerKey ? [<MenuSectionHeader key={headerKey} labelKey={headerKey} />] : []
          for (const { key, labelKey, checked, disabled } of items) {
            nodes.push(
              <MenuCheckItem
                key={key}
                itemKey={`display-${key}`}
                labelKey={labelKey}
                checked={checked}
                disabled={disabled}
                onChange={(value) => onOptionUpdate({ option: key, value })}
              />
            )
          }
          return nodes
        })
      }
    </ToolbarMenu>
  )
}
