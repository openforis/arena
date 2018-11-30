CREATE TABLE
  code_list
(
  id          bigserial NOT NULL,
  uuid        uuid      NOT NULL DEFAULT uuid_generate_v4(),
  props       jsonb              DEFAULT '{}'::jsonb,
  props_draft jsonb              DEFAULT '{}'::jsonb,

  PRIMARY KEY (id)
);

CREATE TABLE
  code_list_level
(
  id           bigserial NOT NULL,
  uuid         uuid      NOT NULL DEFAULT uuid_generate_v4(),
  code_list_id bigint    NOT NULL,
  index        integer   NOT NULL,
  props        jsonb              DEFAULT '{}'::jsonb,
  props_draft  jsonb              DEFAULT '{}'::jsonb,

  PRIMARY KEY (id),
  CONSTRAINT code_list_level_list_fk FOREIGN KEY (code_list_id) REFERENCES code_list (id) ON DELETE CASCADE
);

CREATE TABLE
  code_list_item
(
  id          bigserial NOT NULL,
  uuid        uuid      NOT NULL DEFAULT uuid_generate_v4(),
  level_id    bigint    NOT NULL,
  parent_uuid uuid,
  props       jsonb              DEFAULT '{}'::jsonb,
  props_draft jsonb              DEFAULT '{}'::jsonb,

  PRIMARY KEY (id),
  CONSTRAINT code_list_item_parent_uuid_idx UNIQUE (uuid),
  CONSTRAINT code_list_item_level_fk FOREIGN KEY (level_id) REFERENCES code_list_level (id) ON DELETE CASCADE,
  CONSTRAINT code_list_item_parent_fk FOREIGN KEY (parent_uuid) REFERENCES code_list_item (uuid) ON DELETE CASCADE
);