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
import { useLocation } from 'react-router'

type CrumbItem = {
  key: string
  label: string
  uri: string
  isLast: boolean
}

const CRUMB_MIN_WIDTH_PX = 60

/**
 * Computes how many breadcrumb items fit in the container width.
 * Always keeps at least the first and the last item visible.
 */
const computeMaxItems = (containerWidth: number, itemCount: number): number => {
  if (containerWidth <= 0 || itemCount <= 2) return itemCount
  const available = containerWidth - CRUMB_MIN_WIDTH_PX * 2 // reserve space for first + last
  const middleCount = Math.max(0, Math.floor(available / CRUMB_MIN_WIDTH_PX))
  return Math.min(itemCount, 2 + middleCount)
}

/**
 * App-level breadcrumb navigation bar.
 * Uses MUI Breadcrumbs with a ResizeObserver-driven maxItems so crumbs
 * never overflow their container regardless of label length or screen size.
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

  const crumbs: CrumbItem[] = validPathParts
    .filter((part, idx) => {
      const mod = AppModules.getModuleByPathPart({ levelIndex: idx, pathPart: part })
      return Boolean(mod && mod.key !== homeModules.landing.key)
    })
    .map((part, idx, arr) => {
      const mod = AppModules.getModuleByPathPart({ levelIndex: idx, pathPart: part })
      return {
        key: mod!.key,
        label: i18n.t(`appModules.${mod!.key}`),
        uri: AppModules.appModuleUri(mod!),
        isLast: idx === arr.length - 1,
      }
    })

  const updateMaxItems = useCallback(() => {
    if (containerRef.current) {
      setMaxItems(computeMaxItems(containerRef.current.offsetWidth, crumbs.length))
    }
  }, [crumbs.length])

  useEffect(() => {
    updateMaxItems()
    const observer = new ResizeObserver(updateMaxItems)
    if (containerRef.current) observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [updateMaxItems])

  return (
    <div ref={containerRef} className="breadcrumbs">
      <MuiBreadcrumbs
        maxItems={maxItems}
        itemsBeforeCollapse={1}
        itemsAfterCollapse={1}
        aria-label="breadcrumb"
      >
        {crumbs.map(({ key, label, uri, isLast }) =>
          isLast ? (
            <Typography key={key} color="text.primary" variant="body2" noWrap>
              {label}
            </Typography>
          ) : surveyIsDirty ? (
            <Typography key={key} color="text.secondary" variant="body2" noWrap>
              {label}
            </Typography>
          ) : (
            <MuiLink
              key={key}
              component={Link}
              to={uri}
              underline="hover"
              color="inherit"
              variant="body2"
              noWrap
            >
              {label}
            </MuiLink>
          )
        )}
      </MuiBreadcrumbs>
    </div>
  )
}
