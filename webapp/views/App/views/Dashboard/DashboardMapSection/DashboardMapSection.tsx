import './DashboardMapSection.scss'

import React from 'react'

import { useSurvey } from '@webapp/store/survey'

import { surveyHasGeoAttributes } from '../utils/surveyHasGeoAttributes'
import { DashboardMapContent } from './DashboardMapContent'

/**
 * Dashboard section with geo polygons when the survey defines geo attributes.
 *
 * @returns {React.ReactElement} The section, or null when the survey has no geo attribute.
 */
const DashboardMapSection = () => {
  const survey = useSurvey()

  if (!surveyHasGeoAttributes(survey)) {
    return null
  }

  return <DashboardMapContent />
}

export default DashboardMapSection
