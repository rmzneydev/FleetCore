import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { Maintenance } from '../../maintenance/entities/maintenance.entity.js';
import { WorkshopStatus } from '../workshop-status.enum.js';

@Entity('workshops')
export class Workshop {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 150 })
  name!: string;

  @Column({ type: 'varchar', length: 255 })
  address!: string;

  @Column({ type: 'enum', enum: WorkshopStatus, default: WorkshopStatus.ACTIVE })
  status!: WorkshopStatus;

  @OneToMany(() => Maintenance, (maintenance) => maintenance.workshop)
  maintenances!: Relation<Maintenance[]>;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
