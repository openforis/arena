const db = require('../db/db')
const camelize = require('camelize')

const {jobStatus, isJobStatusEnded} = require('../../common/job/job')

// ============== CREATE

const insertJob = async (job, client = db) =>
  await client.one(`
        INSERT INTO job (uuid, user_id, survey_id, props, parent_uuid)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *`,
    [job.uuid, job.userId, job.surveyId, job.props, job.parentUUID],
    camelize
  )

// ============== READ

const fetchJobById = async (id, client = db) =>
  await client.oneOrNone(
    `SELECT * FROM job
     WHERE id = $1`,
    [id],
    camelize
  )

const fetchActiveJobByUserId = async (userId, client = db) =>
  await client.oneOrNone(
    `SELECT * FROM job
     WHERE user_id = $1
       AND status IN ('${jobStatus.pending}', '${jobStatus.running}')`,
    [userId],
    camelize
  )

// ============== UPDATE

const updateJobStatus = async (id, status, total, processed, props = {}, client = db) =>
  await client.one(
      `UPDATE job
     SET 
        status = $1,
        total = $2,
        processed = $3,
        props = props || $4,
        date_ended = $5
     WHERE id = $6
     RETURNING *`,
    [status, total, processed, props, isJobStatusEnded(status) ? new Date() : null, id],
    camelize
  )

const updateJobProgress = async (id, total, processed, client = db) =>
  await client.one(
      `UPDATE job
     SET 
        total = $1,
        processed = $2
     WHERE id = $3
     RETURNING *`,
    [total, processed, id],
    camelize
  )

module.exports = {
  //CREATE
  insertJob,
  //READ
  fetchJobById,
  fetchActiveJobByUserId,
  //UPDATE
  updateJobProgress,
  updateJobStatus,
  //DELETE
}