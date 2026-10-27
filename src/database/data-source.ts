import { DataSource } from 'typeorm';
import { User } from '../auth/user.entity.js';
import { Maintenance } from '../maintenance/entities/maintenance.entity.js';
import { Mechanic } from '../mechanics/entities/mechanic.entity.js';
import { Vehicle } from '../vehicles/entities/vehicle.entity.js';
import { Workshop } from '../workshops/entities/workshop.entity.js';
import { InitialFleetSchema1761572400000 } from './migrations/InitialFleetSchema1761572400000.js';

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [User, Vehicle, Mechanic, Workshop, Maintenance],
  synchronize: false,
  migrationsRun: false,
  migrations: [InitialFleetSchema1761572400000],
});