CREATE OR REPLACE FUNCTION clone_schema(source_schema text, dest_schema text) RETURNS void AS
$BODY$
DECLARE
  objeto text;
  buffer text;
BEGIN
    EXECUTE 'CREATE SCHEMA ' || dest_schema ;

    FOR objeto IN
        SELECT TABLE_NAME::text FROM information_schema.TABLES WHERE table_schema = source_schema
    LOOP
        buffer := dest_schema || '.' || objeto;
        EXECUTE 'CREATE TABLE ' || buffer || ' (LIKE ' || source_schema || '.' || objeto || ' INCLUDING CONSTRAINTS INCLUDING INDEXES INCLUDING DEFAULTS)';
        EXECUTE 'INSERT INTO ' || buffer || '(SELECT * FROM ' || source_schema || '.' || objeto || ')';
    END LOOP;

END;
$BODY$
LANGUAGE plpgsql VOLATILE;