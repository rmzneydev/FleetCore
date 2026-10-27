import {
  CreateDateColumn,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { User } from '../../auth/user.entity.js';
import { MaintenanceStatus } from '../maintenance-status.enum.js';
import { Maintenance } from './maintenance.entity.js';

// Registro inmutable de cada cambio de estado para la consulta de auditoría del ADMIN.
@Entity('maintenance_status_logs')
@Index('IDX_maintenance_status_logs_maintenance', ['maintenance', 'createdAt'])
export class MaintenanceStatusLog {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Maintenance, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'maintenance_id' })
  maintenance!: Relation<Maintenance>;

  @Column({
    name: 'from_status',
    type: 'enum',
    enum: MaintenanceStatus,
    enumName: 'enum_maintenances_status_enum',
    nullable: true,
  })
  fromStatus!: MaintenanceStatus | null;

  @Column({
    name: 'to_status',
    type: 'enum',
    enum: MaintenanceStatus,
    enumName: 'enum_maintenances_status_enum',
  })
  toStatus!: MaintenanceStatus;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'changed_by_id' })
  changedBy!: Relation<User> | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
