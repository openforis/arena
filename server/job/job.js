import { JobBase, JobStatus } from '@openforis/arena-core'

import { db } from '@server/db/db'
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

  // jobCreator.js reassigns `job.uuid` to the "real" uuid (used to track the job across the
  // API/websocket) right after construction, when a job is created from a serialized job type
  // in a worker thread (see jobThread.js). The logger built in the constructor still embeds the
  // original, discarded uuid, so it needs to be re-created here. Arena's original Job class
  // always exposed this as a public method for exactly this purpose.
  initLogger() {
    this.logger = this.createLogger()
  }

  // Arena's original Job class exposed this as a thin public wrapper around the (now protected,
  // on JobBase) setStatus() method. ~12 production Job subclasses call `this.setStatusFailed()`
  // directly from their own error-handling code (validation/import jobs reporting bad data),
  // so it needs to stay callable from the outside.
  async setStatusFailed() {
    await this.setStatus(JobStatus.failed)
  }

  // JobBase.start() defaults `client` to `null`, taking the no-transaction branch. Arena's
  // original Job always defaulted to the shared `db` client instead, so that jobs started with
  // no argument (e.g. jobThread.js's `this.job.start()`, the production worker-thread entry
  // point) still run inside a real db transaction.
  async start(client = db) {
    return super.start(client)
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
