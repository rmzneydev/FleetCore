import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  OneToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  RelationId,
  UpdateDateColumn,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { Maintenance } from '../../maintenance/entities/maintenance.entity.js';
import { User } from '../../auth/user.entity.js';
import { MechanicStatus } from '../mechanic-status.enum.js';

@Entity('mechanics')
export class Mechanic {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 150 })
  name!: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 255 })
  email!: string;

  @Column({ type: 'varchar', length: 120 })
  specialty!: string;

  @Column({ type: 'enum', enum: MechanicStatus, default: MechanicStatus.ACTIVE })
  status!: MechanicStatus;

  @OneToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'user_id' })
  user!: Relation<User> | null;

  @RelationId((mechanic: Mechanic) => mechanic.user)
  userId!: number | null;

  @OneToMany(() => Maintenance, (maintenance) => maintenance.mechanic)
  maintenances!: Relation<Maintenance[]>;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
