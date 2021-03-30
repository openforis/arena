/* Replace with your SQL commands */

CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE
  "user_invitation"
(
  uuid           uuid        NOT NULL DEFAULT uuid_generate_v4(),
  user_uuid      uuid        NOT NULL,
  survey_uuid    uuid        NULL,
  invited_by     uuid        NOT NULL,
  invited_date   TIMESTAMP   NOT NULL DEFAULT (now() AT TIME ZONE 'UTC'),
  removed_date   TIMESTAMP   NULL,



  PRIMARY KEY ("uuid"),
  CONSTRAINT user_invitation_user_fk FOREIGN KEY (user_uuid) REFERENCES "user" ("uuid") ON DELETE CASCADE,
  CONSTRAINT user_invitation_survey_fk FOREIGN KEY (survey_uuid) REFERENCES "survey" ("uuid") ON DELETE CASCADE,
  CONSTRAINT user_invitation_invited_by_fk FOREIGN KEY (invited_by) REFERENCES "user" ("uuid") ON DELETE CASCADE
);
