import pkg from "pg";
const { Pool } = pkg;

let _pool;

export const createPoolIfNeeded = () => {
	if (_pool) return _pool;
	const connectionString = process.env.PG_URI ? String(process.env.PG_URI).trim() : undefined;
	if (!connectionString) {
		throw new Error('PG_URI missing');
	}
	_pool = new Pool({ connectionString });
	return _pool;
};

export const getPool = () => {
	if (!_pool) {
		return createPoolIfNeeded();
	}
	return _pool;
};

export const connectPostgres = async () => {
	try {
		console.log('Connecting to PostgreSQL...');
		const pool = getPool();
		await pool.connect();
		console.log("PostgreSQL connected");

		await pool.query(`CREATE TABLE IF NOT EXISTS metrics (
			id SERIAL PRIMARY KEY,
			category VARCHAR(100),
			priority VARCHAR(50),
			time_taken INTEGER,
			sla_breached BOOLEAN DEFAULT false,
			created_at TIMESTAMP DEFAULT NOW()
		);`);

		await pool.query(`CREATE TABLE IF NOT EXISTS escalations (
			id SERIAL PRIMARY KEY,
			complaint_id TEXT,
			title TEXT,
			category TEXT,
			created_at TIMESTAMP,
			escalation_time TIMESTAMP,
			escalation_level INT
		);`);

		await pool.query(`CREATE TABLE IF NOT EXISTS departments (
			id SERIAL PRIMARY KEY,
			name TEXT NOT NULL,
			category_handled TEXT[]
		);`);
	} catch (err) {
		const msg = err && err.message ? err.message : String(err);
		if (msg.includes('client password must be a string')) {
			console.error('PostgreSQL connection error: client password must be a string. Check your PG_URI format and ensure the password is a string.');
		} else if (msg.includes('PG_URI missing')) {
			console.error('PostgreSQL connection error: PG_URI missing. Set PG_URI in .env.');
		} else {
			console.error('PostgreSQL connection error:', msg);
		}
		process.exit(1);
	}
};

export default getPool;
