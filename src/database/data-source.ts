import { DataSource } from 'typeorm';
import { InitialFleetSchema1761572400000 } from './migrations/InitialFleetSchema1761572400000.js';

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  synchronize: false,
  migrationsRun: false,
  migrations: [InitialFleetSchema1761572400000],
});