import './Breadcrumbs.scss'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

import MuiBreadcrumbs from '@mui/material/Breadcrumbs'
import MuiLink from '@mui/material/Link'
import Typography from '@mui/material/Typography'

import * as AppModules from '@webapp/app/appModules'
import { homeModules } from '@webapp/app/appModules'
import { useI18n } from '@webapp/store/system'
import { useIsSurveyDirty } from '@webapp/store/survey'
import { computeBreadcrumbsMaxItems } from '@webapp/utils/breadcrumbsUtils'
import { useLocation } from 'react-router'

type CrumbItem = {
  key: string
  label: string
  uri: string
  isLast: boolean
}

const CRUMB_MIN_WIDTH_PX = 60

/**
 * App-level breadcrumb navigation bar.
 * Uses MUI Breadcrumbs with a ResizeObserver-driven maxItems so crumbs
 * never overflow their container regardless of label length or screen size.
 *
 * @returns {React.ReactElement} The rendered breadcrumb bar.
 */
export const Breadcrumbs = () => {
  const location = useLocation()
  const i18n = useI18n()
  const surveyIsDirty = useIsSurveyDirty()
  const containerRef = useRef<HTMLDivElement>(null)
  const [maxItems, setMaxItems] = useState<number>(10)

  const { pathname } = location
  const pathParts = pathname.split('/')
  const validPathParts = pathParts.filter((part) => part && part !== AppModules.app)

  const crumbs: CrumbItem[] = validPathParts.reduce<CrumbItem[]>((acc, part, idx) => {
    const mod = AppModules.getModuleByPathPart({ levelIndex: idx, pathPart: part })
    if (!mod || mod.key === homeModules.landing.key) return acc
    acc.push({
      key: mod.key,
      label: i18n.t(`appModules.${mod.key}`),
      uri: AppModules.appModuleUri(mod),
      isLast: false,
    })
    return acc
  }, [])
  const lastCrumb = crumbs.at(-1)
  if (lastCrumb) lastCrumb.isLast = true

  const updateMaxItems = useCallback(() => {
    if (containerRef.current) {
      setMaxItems(
        computeBreadcrumbsMaxItems({
          containerWidth: containerRef.current.offsetWidth,
          itemCount: crumbs.length,
          crumbMinWidthPx: CRUMB_MIN_WIDTH_PX,
        })
      )
    }
  }, [crumbs.length])

  useEffect(() => {
    updateMaxItems()
    const observer = new ResizeObserver(updateMaxItems)
    if (containerRef.current) observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [updateMaxItems])

  /**
   * Renders one breadcrumb item as plain text or a link.
   *
   * @param crumb - Breadcrumb item to render
   * @returns Crumb element
   */
  const renderCrumb = ({ key, label, uri, isLast }: CrumbItem) => {
    if (isLast) {
      return (
        <Typography key={key} color="text.primary" variant="body2" noWrap>
          {label}
        </Typography>
      )
    }
    if (surveyIsDirty) {
      return (
        <Typography key={key} color="text.secondary" variant="body2" noWrap>
          {label}
        </Typography>
      )
    }
    return (
      <MuiLink key={key} component={Link} to={uri} underline="hover" color="inherit" variant="body2" noWrap>
        {label}
      </MuiLink>
    )
  }

  return (
    <div ref={containerRef} className="breadcrumbs">
      <MuiBreadcrumbs maxItems={maxItems} itemsBeforeCollapse={1} itemsAfterCollapse={1} aria-label="breadcrumb">
        {crumbs.map(renderCrumb)}
      </MuiBreadcrumbs>
    </div>
  )
}
