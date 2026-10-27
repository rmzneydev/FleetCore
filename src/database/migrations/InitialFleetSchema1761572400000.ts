import type { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialFleetSchema1761572400000 implements MigrationInterface {
  name = 'InitialFleetSchema1761572400000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "enum_users_role_enum" AS ENUM ('ADMIN', 'TECHNICIAN');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "enum_vehicles_status_enum" AS ENUM ('AVAILABLE', 'IN_MAINTENANCE', 'INACTIVE');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "enum_mechanics_status_enum" AS ENUM ('ACTIVE', 'INACTIVE');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "enum_workshops_status_enum" AS ENUM ('ACTIVE', 'INACTIVE');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "enum_maintenances_type_enum" AS ENUM ('PREVENTIVE', 'CORRECTIVE');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "enum_maintenances_status_enum" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "email" varchar(255) NOT NULL,
        "password_hash" varchar(255) NOT NULL,
        "role" "enum_users_role_enum" NOT NULL DEFAULT 'TECHNICIAN',
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_users_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "vehicles" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "plate" varchar(20) NOT NULL,
        "brand" varchar(100) NOT NULL,
        "model" varchar(100) NOT NULL,
        "year" smallint NOT NULL,
        "mileage" integer NOT NULL DEFAULT 0,
        "status" "enum_vehicles_status_enum" NOT NULL DEFAULT 'AVAILABLE',
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_vehicles_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "mechanics" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "name" varchar(150) NOT NULL,
        "email" varchar(255) NOT NULL,
        "specialty" varchar(120) NOT NULL,
        "status" "enum_mechanics_status_enum" NOT NULL DEFAULT 'ACTIVE',
        "user_id" uuid,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_mechanics_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_mechanics_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "workshops" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "name" varchar(150) NOT NULL,
        "address" varchar(255) NOT NULL,
        "status" "enum_workshops_status_enum" NOT NULL DEFAULT 'ACTIVE',
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_workshops_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "maintenances" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "type" "enum_maintenances_type_enum" NOT NULL,
        "description" varchar(1000) NOT NULL,
        "mileage" integer NOT NULL,
        "scheduled_at" timestamptz NOT NULL,
        "scheduled_end_at" timestamptz NOT NULL,
        "status" "enum_maintenances_status_enum" NOT NULL DEFAULT 'SCHEDULED',
        "work_performed" text,
        "final_cost" numeric(12,2),
        "finished_at" timestamptz,
        "final_mileage" integer,
        "vehicle_id" uuid NOT NULL,
        "mechanic_id" uuid NOT NULL,
        "workshop_id" uuid NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_maintenances_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_maintenances_vehicle" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_maintenances_mechanic" FOREIGN KEY ("mechanic_id") REFERENCES "mechanics"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_maintenances_workshop" FOREIGN KEY ("workshop_id") REFERENCES "workshops"("id") ON DELETE RESTRICT
      )
    `);

    await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_users_email_unique" ON "users" ("email")`);
    await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_vehicles_plate_unique" ON "vehicles" ("plate")`);
    await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_mechanics_email_unique" ON "mechanics" ("email")`);
    await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_mechanics_user_unique" ON "mechanics" ("user_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_maintenances_vehicle_status" ON "maintenances" ("vehicle_id", "status")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_maintenances_mechanic_status_schedule" ON "maintenances" ("mechanic_id", "status", "scheduled_at")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_maintenances_workshop_status" ON "maintenances" ("workshop_id", "status")`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "maintenances"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "workshops"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "mechanics"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "vehicles"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "enum_maintenances_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "enum_maintenances_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "enum_workshops_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "enum_mechanics_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "enum_vehicles_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "enum_users_role_enum"`);
  }
}