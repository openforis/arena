CREATE TABLE
  category
(
  id          bigint    NOT NULL GENERATED ALWAYS AS IDENTITY,
  uuid        uuid      NOT NULL DEFAULT uuid_generate_v4(),
  props       jsonb     NOT NULL DEFAULT '{}'::jsonb,
  props_draft jsonb     NOT NULL DEFAULT '{}'::jsonb,
  validation  jsonb     NOT NULL DEFAULT '{}'::jsonb,
  published   boolean   NOT NULL DEFAULT false,

  PRIMARY KEY (id),
  CONSTRAINT category_uuid_idx UNIQUE (uuid)
);

CREATE TABLE
  category_level
(
  id            bigint    NOT NULL GENERATED ALWAYS AS IDENTITY,
  uuid          uuid      NOT NULL DEFAULT uuid_generate_v4(),
  category_uuid uuid      NOT NULL,
  index         integer   NOT NULL,
  props         jsonb     NOT NULL DEFAULT '{}'::jsonb,
  props_draft   jsonb     NOT NULL DEFAULT '{}'::jsonb,

  PRIMARY KEY (id),
  CONSTRAINT category_level_uuid_idx UNIQUE (uuid),
  CONSTRAINT category_level_category_index_idx UNIQUE (category_uuid, index),
  CONSTRAINT category_level_category_fk FOREIGN KEY (category_uuid) REFERENCES category (uuid) ON DELETE CASCADE
);

CREATE TABLE
  category_item
(
  id          bigint    NOT NULL GENERATED ALWAYS AS IDENTITY,
  uuid        uuid      NOT NULL DEFAULT uuid_generate_v4(),
  level_uuid  uuid      NOT NULL,
  parent_uuid uuid          NULL,
  props       jsonb     NOT NULL DEFAULT '{}'::jsonb,
  props_draft jsonb     NOT NULL DEFAULT '{}'::jsonb,

  PRIMARY KEY (id),
  CONSTRAINT category_item_uuid_idx UNIQUE (uuid),
  CONSTRAINT category_item_level_fk FOREIGN KEY (level_uuid)
    REFERENCES category_level (uuid) ON DELETE CASCADE,
  CONSTRAINT category_item_parent_fk FOREIGN KEY (parent_uuid)
    REFERENCES category_item (uuid) ON DELETE CASCADE
);

CREATE INDEX category_item_level_uuid_idx ON category_item(level_uuid);
CREATE INDEX category_item_parent_uuid_idx ON category_item(parent_uuid);
CREATE INDEX category_item_code_idx ON category_item (level_uuid, (props->>'code'));
CREATE INDEX category_item_code_draft_idx ON category_item (level_uuid, (props_draft->>'code'));
