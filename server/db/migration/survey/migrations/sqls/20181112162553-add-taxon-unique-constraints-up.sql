CREATE UNIQUE INDEX taxon_props_code_idx ON taxon (taxonomy_id, (props->>'code'));

CREATE UNIQUE INDEX taxon_props_scientific_name_idx ON taxon (taxonomy_id, (props->>'scientificName'));

CREATE UNIQUE INDEX taxon_props_draft_code_idx ON taxon (taxonomy_id, (props_draft->>'code'));

CREATE UNIQUE INDEX taxon_props_draft_scientific_name_idx ON taxon (taxonomy_id,  (props_draft->>'scientificName'));