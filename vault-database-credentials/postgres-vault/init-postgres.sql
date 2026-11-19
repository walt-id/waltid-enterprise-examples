\getenv vault_password VAULT_DB_PASSWORD

CREATE ROLE waltid_owner NOLOGIN;
CREATE SCHEMA waltid AUTHORIZATION waltid_owner;

CREATE ROLE waltid_static LOGIN;
GRANT waltid_owner TO waltid_static;
ALTER ROLE waltid_static IN DATABASE waltid_enterprise SET role TO waltid_owner;

CREATE ROLE vault_db_admin LOGIN CREATEROLE PASSWORD :'vault_password';
GRANT waltid_static TO vault_db_admin WITH ADMIN TRUE, SET FALSE, INHERIT FALSE;
GRANT waltid_owner TO vault_db_admin WITH ADMIN TRUE, SET TRUE, INHERIT FALSE;
GRANT pg_signal_backend TO vault_db_admin;
