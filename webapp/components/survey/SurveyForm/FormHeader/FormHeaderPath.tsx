import React, { useCallback, useLayoutEffect, useRef, useState } from 'react'
import { useDispatch } from 'react-redux'

import IconButton from '@mui/material/IconButton'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import MuiBreadcrumbs from '@mui/material/Breadcrumbs'
import SvgIcon from '@mui/material/SvgIcon'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'

import * as Survey from '@core/survey/survey'

import { useNotifyInfo } from '@webapp/components/hooks'
import { useI18n } from '@webapp/store/system'
import { useSurvey } from '@webapp/store/survey'
import { SurveyFormActions } from '@webapp/store/ui/surveyForm'
import { computeBreadcrumbsMaxItems } from '@webapp/utils/breadcrumbsUtils'
import { copyToClipboard } from '@webapp/utils/domUtils'

import { usePathCrumbs, type FormPathCrumb } from './usePathCrumbs'

/** Estimated minimum width per visible crumb slot (survey labels are often long). */
const CRUMB_MIN_WIDTH_PX = 140

/** Width reserved for the condensed-menu trigger button. */
const MENU_BUTTON_WIDTH_PX = 36

/** Width reserved for the copy-path icon button. */
const COPY_BUTTON_WIDTH_PX = 36

const ITEMS_BEFORE_COLLAPSE = 1

const ITEMS_AFTER_COLLAPSE = 1

/** Matches survey location paths used elsewhere (e.g. map attribute popups). */
const PATH_SEPARATOR = ' -> '

const breadcrumbsSx = {
  minWidth: 0,
  overflow: 'hidden',
  '& .MuiBreadcrumbs-ol': {
    flexWrap: 'nowrap',
  },
  '& .MuiBreadcrumbs-li': {
    minWidth: 0,
    overflow: 'hidden',
    flexShrink: 1,
  },
}

const crumbTypographySx = {
  fontSize: '0.9rem',
  fontWeight: 600,
  display: 'block',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  minWidth: 0,
}

const menuItemSx = {
  maxWidth: 360,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}

const MoreHorizIcon = () => (
  <SvgIcon fontSize="small">
    <path d="M6 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm12 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-6 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
  </SvgIcon>
)

type Props = {
  entry: boolean
  nodeDefPageName: string
}

/**
 * Renders a breadcrumb label for one path segment.
 */
const CrumbLabel = ({ crumb, isLast }: { crumb: FormPathCrumb; isLast: boolean }) => (
  <Typography
    color={isLast ? 'text.primary' : 'text.secondary'}
    variant="body2"
    component="span"
    sx={crumbTypographySx}
  >
    {crumb.label}
  </Typography>
)

/**
 * Renders the current survey form page path as MUI Breadcrumbs with responsive
 * collapsing. Condensed segments open in a dropdown menu (MUI CondensedWithMenu pattern).
 *
 * @param entry - Whether the form is in data entry mode
 * @param nodeDefPageName - Name of the active page node def (for test hooks)
 * @returns {React.ReactElement} The form path breadcrumb bar
 */
export const FormHeaderPath = ({ entry, nodeDefPageName }: Props) => {
  const crumbs = usePathCrumbs(entry)
  const survey = useSurvey()
  const dispatch = useDispatch()
  const i18n = useI18n()
  const notifyInfo = useNotifyInfo()
  const containerRef = useRef<HTMLDivElement>(null)
  const [maxItems, setMaxItems] = useState(() => (crumbs.length <= 2 ? crumbs.length : 2))
  const [menuAnchorEl, setMenuAnchorEl] = useState<HTMLButtonElement | null>(null)

  const updateMaxItems = useCallback(() => {
    if (containerRef.current) {
      setMaxItems(
        computeBreadcrumbsMaxItems({
          containerWidth: containerRef.current.offsetWidth,
          itemCount: crumbs.length,
          crumbMinWidthPx: CRUMB_MIN_WIDTH_PX,
          reservedWidthPx: MENU_BUTTON_WIDTH_PX + COPY_BUTTON_WIDTH_PX,
          fallbackMaxItems: 2,
        })
      )
    }
  }, [crumbs.length])

  useLayoutEffect(() => {
    updateMaxItems()
    const observer = new ResizeObserver(updateMaxItems)
    if (containerRef.current) observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [updateMaxItems])

  const needsCollapse = crumbs.length > maxItems
  const beforeCrumbs = needsCollapse ? crumbs.slice(0, ITEMS_BEFORE_COLLAPSE) : crumbs
  const afterCrumbs = needsCollapse ? crumbs.slice(crumbs.length - ITEMS_AFTER_COLLAPSE) : []
  const menuCrumbs = needsCollapse ? crumbs.slice(ITEMS_BEFORE_COLLAPSE, crumbs.length - ITEMS_AFTER_COLLAPSE) : []

  const openMenu = Boolean(menuAnchorEl)

  const handleMenuOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setMenuAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setMenuAnchorEl(null)
  }

  const handleNavigateToCrumb = (nodeDefUuid: string) => {
    const nodeDef = Survey.getNodeDefByUuid(nodeDefUuid)(survey)
    if (nodeDef) {
      dispatch(SurveyFormActions.setFormActivePage({ nodeDef }))
    }
    handleMenuClose()
  }

  const handleCopyPath = async () => {
    const pathText = crumbs.map((crumb) => crumb.label).join(PATH_SEPARATOR)
    if (!pathText) return
    if (await copyToClipboard(pathText)) {
      notifyInfo({ key: 'surveyForm:pathCopiedToClipboard' })
    }
  }

  return (
    <div
      ref={containerRef}
      className="survey-form-header__path"
      data-nodedef-name={nodeDefPageName}
      id="survey-form-page-label"
    >
      {needsCollapse && (
        <Menu anchorEl={menuAnchorEl} open={openMenu} onClose={handleMenuClose}>
          {menuCrumbs.map((crumb) => (
            <MenuItem key={crumb.key} sx={menuItemSx} onClick={() => handleNavigateToCrumb(crumb.key)}>
              {crumb.label}
            </MenuItem>
          ))}
        </Menu>
      )}

      <div className="survey-form-header__path-trail">
        <MuiBreadcrumbs aria-label="form page path" sx={breadcrumbsSx}>
          {beforeCrumbs.map((crumb, index) => (
            <CrumbLabel key={crumb.key} crumb={crumb} isLast={!needsCollapse && index === crumbs.length - 1} />
          ))}

          {needsCollapse && (
            <IconButton color="inherit" size="small" aria-label="Show path" onClick={handleMenuOpen}>
              <MoreHorizIcon />
            </IconButton>
          )}

          {afterCrumbs.map((crumb, index) => (
            <CrumbLabel key={crumb.key} crumb={crumb} isLast={index === afterCrumbs.length - 1} />
          ))}
        </MuiBreadcrumbs>

        <Tooltip title={i18n.t('surveyForm:copyPath')}>
          <span>
            <IconButton
              color="inherit"
              size="small"
              aria-label={i18n.t('surveyForm:copyPath')}
              disabled={crumbs.length === 0}
              onClick={handleCopyPath}
            >
              <span className="icon icon-copy icon-12px" />
            </IconButton>
          </span>
        </Tooltip>
      </div>
    </div>
  )
}
