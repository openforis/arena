CREATE TABLE activity_log
(
  id           bigint       NOT NULL GENERATED ALWAYS AS IDENTITY,
  type         VARCHAR(255) NOT NULL,
  user_uuid    uuid         NOT NULL,
  content      jsonb        NOT NULL DEFAULT '{}'::jsonb,
  system       boolean      NOT NULL DEFAULT false,
  date_created TIMESTAMP    NOT NULL DEFAULT (now() AT TIME ZONE 'UTC'),
  PRIMARY KEY (id),
  CONSTRAINT activity_log_user_fk FOREIGN KEY (user_uuid) REFERENCES "user" ("uuid") ON DELETE CASCADE
);

CREATE INDEX activity_log_user_aggregated_idx ON activity_log (
  (date_created::date) DESC,
  user_uuid,
  type,
  ((content->>'uuid')::uuid) NULLS LAST,
  date_created DESC
) WHERE NOT system;

-- This view exists as a way to efficiently get iterate over
-- activity_log_user_aggregate. Using the other view directly
-- will result in worse performance due to the inability to
-- use indexes correctly.
CREATE VIEW activity_log_user_aggregate_keys AS
SELECT
  date_created::date as date,
  user_uuid,
  type,
  (content->>'uuid')::uuid,
  content->>'key',
  MAX(id) as id
FROM activity_log
WHERE not system
group by 1,2,3,4,5
ORDER BY date_created::date DESC;

-- This view aggregates each user's activity log entries by the day
-- Each day contains its last individual change per each of following
-- attribute combinations:
--   * user,
--   * change type (type), and
--   * the content UUID (if any)
CREATE VIEW activity_log_user_aggregate AS
SELECT
    DISTINCT ON (
        date_created::date,
        user_uuid,
        type,
        content_uuid,
        content_key
    )
    id,
    date_created,
    user_uuid,
    type,
    (content->>'uuid')::uuid as content_uuid,
    content->>'key' as content_key,
    content
FROM
    activity_log
WHERE
    NOT system
ORDER BY
    date_created::date DESC,
    user_uuid,
    type,
    content_uuid,
    content_key,
    date_created DESC;
