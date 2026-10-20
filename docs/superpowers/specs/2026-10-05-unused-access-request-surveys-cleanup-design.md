# Unused Access Request Surveys Cleanup — Design Spec

**Date:** 2026-10-05  
**Status:** Implemented

## Goal

Delete the survey and the user account created by accepting a user access request when the user never logs in
(e.g. the request was submitted with a wrong email address), without relying on the activity log, which is
disabled on the production server (`ACTIVITY_LOG_DISABLED`).

## Background

- A user who never logged in never accepted the invitation: `status = 'INVITED'` and `password IS NULL`.
  `expiredInvitationWhereCondition` (`userRepository.js`) already selects them once the invitation and the
  access request are older than 1 week, and the `expiredUserInvitationsCleanup` scheduler deletes them.
- The survey created for them was only logged, not deleted: its deletion used to depend on the activity log
  entries count (removed in #3304).
- `survey.owner_uuid` references the user without cascade, so the user cannot be deleted while the survey exists.

## Decisions

| Topic | Decision |
| ----- | -------- |
| User inactivity | Never logged in (existing expired invitation condition), not "inactive for some time" |
| Expiry | 1 week (unchanged) |
| Acceptance date | `user_invitation.invited_date` of the invitation to that survey |
| Untouched survey | `survey.date_modified` within 10 minutes of the acceptance date |
| Extra guards | Unpublished, not a template, no other users in its groups (existing); no records (new) |

## Design

- `fetchSurveyIdsOfExpiredInvitationUsers` (`authGroupRepository.js`) additionally requires a `user_invitation`
  for that user and survey whose `invited_date` is within 10 minutes of `survey.date_modified`.
- `deleteExpiredInvitationsUsersAndSurveys` (`userService.js`) deletes those surveys (skipping the ones with
  records, logging failures per survey) before deleting the users, then deletes users and access requests as before.

## Why the date comparison is safe

- The survey is created (or cloned from a template) just before the invitation is inserted.
- Both columns are stored in UTC; changing the survey owner at acceptance does not update `date_modified`,
  and neither do the survey data migrations.
- Any later edit (e.g. by a system administrator) moves `date_modified` forward: the survey is kept and, because
  of the owner foreign key, so is the user. A slow template clone can only prevent a deletion, never cause one.

## Testing

`test/integration/tests/050expiredInvitationSurveysCleanupTest.ts` covers the selection query: untouched survey,
survey modified within the tolerance, survey modified later, not expired invitation.
