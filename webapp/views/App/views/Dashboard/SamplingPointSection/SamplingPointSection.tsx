import React from 'react'

import { TestId } from '@webapp/utils/testId'

import { DashboardSection } from '../components/DashboardSection'
import SamplingPointDataSummary from '../SamplingPointDataSummary'

/**
 * Dashboard section with sampling-point data completion chart.
 *
 * @returns {React.ReactElement} The section.
 */
const SamplingPointSection = () => (
  <DashboardSection testId={TestId.dashboard.samplingSection}>
    <SamplingPointDataSummary />
  </DashboardSection>
)

export default SamplingPointSection
