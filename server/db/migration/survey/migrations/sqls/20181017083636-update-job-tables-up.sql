ALTER TABLE job
  ADD COLUMN status varchar(63) NOT NULL DEFAULT 'created',
  ADD COLUMN total bigint,
  ADD COLUMN processed bigint,
  ADD COLUMN date_started TIMESTAMP without TIME zone DEFAULT now() NOT NULL,
  ADD COLUMN date_ended TIMESTAMP without TIME zone
  ;
