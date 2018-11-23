ALTER TABLE
    code_list_item
    DROP CONSTRAINT IF EXISTS code_list_item_parent_fk,
    DROP COLUMN parent_id,
    ADD COLUMN parent_uuid uuid;

CREATE UNIQUE INDEX code_list_item_parent_uuid_idx
  ON code_list_item (uuid);

ALTER TABLE
    code_list_item
    ADD CONSTRAINT code_list_item_parent_fk
      FOREIGN KEY (parent_uuid)
      REFERENCES code_list_item (uuid)
      ON DELETE CASCADE;


