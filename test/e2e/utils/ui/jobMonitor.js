import { click, expectExists } from '../api'

export const expectExistsJobMonitorWithErrors = async () =>
  expectExists({ selector: '.app-job-monitor .progress-bar.failed' })

export const closeJobMonitor = () => click('Close')
