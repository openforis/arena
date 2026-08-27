import { JobBase } from '@openforis/arena-core'

import * as Log from '@server/log/log'
import SystemError from '@core/systemError'

export default class Job extends JobBase {
  constructor(type, params = {}, innerJobs = []) {
    super({ ...params, type }, innerJobs)
    this.params = params // original reference, distinct from the (copied, shared) context
    this.result = {} // arena's convention: generateResult()/setResult() build this up incrementally
  }

  createLogger() {
    return Log.getLogger(`Job ${this.constructor.name} (${this.uuid})`)
  }

  getErrorInfo(error) {
    if (error instanceof SystemError) {
      return { key: `appErrors:${error.key}`, params: error.params }
    }
    return super.getErrorInfo(error)
  }

  // Deviation from the task-9 brief's exact code: JobBase only ever stores the transaction handle
  // as `this.context.tx`, never as a flat `this.tx`. Arena's original Job class exposed it as
  // `this.tx` directly, and ~50 existing Job subclasses (~108 call sites) read `this.tx` to pass
  // the current transaction into manager/repository calls. Without this getter, all of those call
  // sites would silently receive `undefined`, breaking transactional atomicity for every job that
  // touches the database. See task-9-report.md for details.
  get tx() {
    return this.context.tx
  }
}
