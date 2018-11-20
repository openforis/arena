CREATE UNIQUE INDEX taxon_vernacular_name_props_lang_idx ON taxon_vernacular_name (taxon_uuid, (props->>'lang'));

CREATE UNIQUE INDEX taxon_vernacular_name_props_draft_lang_idx ON taxon_vernacular_name (taxon_uuid, (props_draft->>'lang'));