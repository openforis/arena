const {parentPort, workerData} = require('worker_threads')

const {jobThreadMessageTypes, jobToJSON} = require('./jobUtils')

const JobCreator = require('./jobCreator')

/**
 * Active job
 */
let job = null

const sendJobToParentThread = () => {
  parentPort.postMessage(jobToJSON(job))
}

const handleJobEvent = async () => {
  sendJobToParentThread()

  if (job.isEnded()) {
    parentPort.close()
  }
}

const execute = () => {
  const {jobType, params} = workerData

  job = JobCreator.createJob(jobType, params)

  job
    .onEvent(handleJobEvent)
    .start()
}

execute()

parentPort.on('message', msg => {
  switch (msg.type) {
    case jobThreadMessageTypes.fetchJob:
      sendJobToParentThread()
      break
    case jobThreadMessageTypes.cancelJob:
      job.cancel()
      break
  }
})

