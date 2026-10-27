import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  RelationId,
  UpdateDateColumn,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { Mechanic } from '../../mechanics/entities/mechanic.entity.js';
import { Vehicle } from '../../vehicles/entities/vehicle.entity.js';
import { Workshop } from '../../workshops/entities/workshop.entity.js';
import { MaintenanceStatus } from '../maintenance-status.enum.js';
import { MaintenanceType } from '../maintenance-type.enum.js';

@Entity('maintenances')
@Index('IDX_maintenances_vehicle_status', ['vehicle', 'status'])
@Index('IDX_maintenances_mechanic_status_schedule', ['mechanic', 'status', 'scheduledAt'])
@Index('IDX_maintenances_workshop_status', ['workshop', 'status'])
export class Maintenance {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'enum', enum: MaintenanceType })
  type!: MaintenanceType;

  @Column({ type: 'varchar', length: 1000 })
  description!: string;

  @Column({ type: 'integer' })
  mileage!: number;

  @Column({ name: 'scheduled_at', type: 'timestamptz' })
  scheduledAt!: Date;

  @Column({ name: 'scheduled_end_at', type: 'timestamptz' })
  scheduledEndAt!: Date;

  @Column({ type: 'enum', enum: MaintenanceStatus, default: MaintenanceStatus.SCHEDULED })
  status!: MaintenanceStatus;

  @Column({ name: 'work_performed', type: 'text', nullable: true })
  workPerformed!: string | null;

  @Column({ name: 'final_cost', type: 'numeric', precision: 12, scale: 2, nullable: true })
  finalCost!: string | null;

  @Column({ name: 'finished_at', type: 'timestamptz', nullable: true })
  finishedAt!: Date | null;

  @Column({ name: 'final_mileage', type: 'integer', nullable: true })
  finalMileage!: number | null;

  @ManyToOne(() => Vehicle, (vehicle) => vehicle.maintenances, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'vehicle_id' })
  vehicle!: Relation<Vehicle>;

  @RelationId((maintenance: Maintenance) => maintenance.vehicle)
  vehicleId!: number;

  @ManyToOne(() => Mechanic, (mechanic) => mechanic.maintenances, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'mechanic_id' })
  mechanic!: Relation<Mechanic>;

  @RelationId((maintenance: Maintenance) => maintenance.mechanic)
  mechanicId!: number;

  @ManyToOne(() => Workshop, (workshop) => workshop.maintenances, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'workshop_id' })
  workshop!: Relation<Workshop>;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}