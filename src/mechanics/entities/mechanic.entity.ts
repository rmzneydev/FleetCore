import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Maintenance } from '../../maintenance/entities/maintenance.entity.js';
import { MechanicStatus } from '../mechanic-status.enum.js';

@Entity('mechanics')
export class Mechanic {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 150 })
  name!: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 255 })
  email!: string;

  @Column({ type: 'varchar', length: 120 })
  specialty!: string;

  @Column({ type: 'enum', enum: MechanicStatus, default: MechanicStatus.ACTIVE })
  status!: MechanicStatus;

  @OneToMany(() => Maintenance, (maintenance) => maintenance.mechanic)
  maintenances!: Maintenance[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
