import path from 'path';
import { jobThreadMessageTypes } from './jobUtils';
import ThreadsCache from '../threads/threadsCache';
import ThreadManager from '../threads/threadManager';
import WebSocket from '../utils/webSocket';
import WebSocketEvents from '../../common/webSocket/webSocketEvents';

// USER JOB WORKERS

const userJobThreads = new ThreadsCache()

const notifyJobUpdate = async jobSerialized => {
  const userUuid = jobSerialized.userUuid

  WebSocket.notifyUser(userUuid, WebSocketEvents.jobUpdate, jobSerialized)

  if (jobSerialized.ended) {
    const thread = userJobThreads.getThread(userUuid)
    //delay thread termination by 1 second (give time to print debug info to the console)
    setTimeout(() => {
        thread.terminate()
        userJobThreads.removeThread(userUuid)
      },
      1000
    )
  }
}

// ====== UPDATE

const cancelActiveJobByUserUuid = async userUuid => {
  const jobThread = userJobThreads.getThread(userUuid)
  if (jobThread) {
    jobThread.postMessage({ type: jobThreadMessageTypes.cancelJob })
  }
}

// ====== EXECUTE

const executeJobThread = job => {

  const thread = new ThreadManager(
    path.resolve(__dirname, 'jobThread.js'),
    { jobType: job.type, jobParams: job.params },
    async job => await notifyJobUpdate(job), // XXX: this is not a Promise
  )

  // XXX: was invalid:
  // userJobThreads.putThread({ key: job.userUuid, worker: thread })
  userJobThreads.putThread(job.userUuid, thread)
}

export default {
  executeJobThread,

  cancelActiveJobByUserUuid,
};
