import { click, expectExists } from '../api'

const statuses = {
  failed: 'failed',
  succeeded: 'succeeded',
}

const expectExistsJobMonitor = async ({ status }) =>
  expectExists({ selector: `.app-job-monitor .progress-bar.${status}` })

export const expectExistsJobMonitorWithErrors = async () => expectExistsJobMonitor({ status: statuses.failed })

export const expectExistsJobMonitorSucceeded = async () => expectExistsJobMonitor({ status: statuses.succeeded })

export const closeJobMonitor = () => click('Close')
