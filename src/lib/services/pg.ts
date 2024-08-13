import postgres from "postgres";

const user = import.meta.env.PG_USER;
const password = import.meta.env.PG_PASSWORD;
const database = import.meta.env.PG_DATABASE;
const host = import.meta.env.PG_HOST;
const port = import.meta.env.PG_PORT;
const sslMode = import.meta.env.PG_SSL_MODE;
const sql = postgres({
	user,
	password,
	database,
	host,
	port,
	ssl: sslMode === "require",
	transform: postgres.toCamel,
});

console.log(`Connection to database: ${host}:${port}/${database}`);
export default sql;
