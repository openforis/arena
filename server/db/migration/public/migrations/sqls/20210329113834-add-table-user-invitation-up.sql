/* Replace with your SQL commands */

CREATE TABLE
  "user_invitation"
(

  id             bigint    NOT NULL GENERATED ALWAYS AS IDENTITY,
  user_uuid      uuid        NOT NULL,
  survey_uuid    uuid        NULL,
  invited_by     uuid        NOT NULL,
  invited_date   TIMESTAMP   NOT NULL DEFAULT (now() AT TIME ZONE 'UTC'),
  removed_date   TIMESTAMP   NULL,



  PRIMARY KEY ("id"),
  CONSTRAINT user_invitation_user_fk FOREIGN KEY (user_uuid) REFERENCES "user" ("uuid") ON DELETE CASCADE,
  CONSTRAINT user_invitation_survey_fk FOREIGN KEY (survey_uuid) REFERENCES "survey" ("uuid") ON DELETE CASCADE,
  CONSTRAINT user_invitation_invited_by_fk FOREIGN KEY (invited_by) REFERENCES "user" ("uuid") ON DELETE CASCADE
);
