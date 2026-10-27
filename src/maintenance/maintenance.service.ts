import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import type { AuthenticatedUser } from '../auth/jwt-payload.interface.js';
import { UserRole } from '../auth/role.enum.js';
import { User } from '../auth/user.entity.js';
import { Mechanic } from '../mechanics/entities/mechanic.entity.js';
import { MechanicStatus } from '../mechanics/mechanic-status.enum.js';
import { Vehicle } from '../vehicles/entities/vehicle.entity.js';
import { VehicleStatus } from '../vehicles/vehicle-status.enum.js';
import { Workshop } from '../workshops/entities/workshop.entity.js';
import { WorkshopStatus } from '../workshops/workshop-status.enum.js';
import { CreateMaintenanceDto } from './dto/create-maintenance.dto.js';
import { UpdateMaintenanceStatusDto } from './dto/update-maintenance-status.dto.js';
import { Maintenance } from './entities/maintenance.entity.js';
import { MaintenanceStatus } from './maintenance-status.enum.js';
import { isAllowedMaintenanceTransition } from './maintenance.rules.js';

const ACTIVE_STATUSES = [MaintenanceStatus.SCHEDULED, MaintenanceStatus.IN_PROGRESS];
const MAINTENANCE_RELATIONS = { vehicle: true, mechanic: true, workshop: true } as const;

@Injectable()
export class MaintenanceService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Maintenance)
    private readonly maintenances: Repository<Maintenance>,
  ) {}

  async create(dto: CreateMaintenanceDto): Promise<Maintenance> {
    const scheduledAt = new Date(dto.scheduledAt);
    const scheduledEndAt = new Date(dto.scheduledEndAt);
    if (scheduledEndAt <= scheduledAt) {
      throw new BadRequestException('La fecha de fin debe ser posterior al inicio');
    }

    // Los locks por recurso serializan solicitudes concurrentes para el mismo vehículo/mecánico.
    const maintenanceId = await this.dataSource.transaction(async (manager) => {
      const vehicles = manager.getRepository(Vehicle);
      const mechanics = manager.getRepository(Mechanic);
      const workshops = manager.getRepository(Workshop);
      const maintenances = manager.getRepository(Maintenance);

      const vehicle = await vehicles.findOne({
        where: { id: dto.vehicleId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!vehicle) throw new NotFoundException('Vehículo no encontrado');
      if (vehicle.status === VehicleStatus.INACTIVE) {
        throw new ConflictException('No se puede asignar un vehículo inactivo');
      }

      const mechanic = await mechanics.findOne({
        where: { id: dto.mechanicId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!mechanic) throw new NotFoundException('Mecánico no encontrado');
      if (mechanic.status !== MechanicStatus.ACTIVE) {
        throw new ConflictException('No se puede asignar un mecánico inactivo');
      }

      const workshop = await workshops.findOne({
        where: { id: dto.workshopId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!workshop) throw new NotFoundException('Taller no encontrado');
      if (workshop.status !== WorkshopStatus.ACTIVE) {
        throw new ConflictException('No se puede asignar un taller inactivo');
      }
      if (dto.mileage < vehicle.mileage) {
        throw new BadRequestException('El kilometraje del mantenimiento no puede ser inferior al del vehículo');
      }

      const activeVehicleMaintenance = await maintenances
        .createQueryBuilder('maintenance')
        .where('maintenance.vehicle_id = :vehicleId', { vehicleId: vehicle.id })
        .andWhere('maintenance.status IN (:...statuses)', { statuses: ACTIVE_STATUSES })
        .andWhere('maintenance.scheduled_at < :scheduledEndAt', { scheduledEndAt })
        .andWhere('maintenance.scheduled_end_at > :scheduledAt', { scheduledAt })
        .getOne();
      if (activeVehicleMaintenance) {
        throw new ConflictException(`El vehículo ${vehicle.plate} ya tiene un mantenimiento activo`);
      }

      const overlappingMaintenance = await maintenances
        .createQueryBuilder('maintenance')
        .where('maintenance.mechanic_id = :mechanicId', { mechanicId: mechanic.id })
        .andWhere('maintenance.status IN (:...statuses)', { statuses: ACTIVE_STATUSES })
        .andWhere('maintenance.scheduled_at < :scheduledEndAt', { scheduledEndAt })
        .andWhere('maintenance.scheduled_end_at > :scheduledAt', { scheduledAt })
        .getOne();
      if (overlappingMaintenance) {
        throw new ConflictException('El mecánico ya tiene un mantenimiento en ese horario');
      }

      const maintenance = maintenances.create({
        type: dto.type,
        description: dto.description,
        mileage: dto.mileage,
        scheduledAt,
        scheduledEndAt,
        status: MaintenanceStatus.SCHEDULED,
        vehicle,
        mechanic,
        workshop,
      });
      return (await maintenances.save(maintenance)).id;
    });

    return this.findOne(maintenanceId);
  }

  findAll(): Promise<Maintenance[]> {
    return this.maintenances.find({
      relations: MAINTENANCE_RELATIONS,
      order: { scheduledAt: 'ASC' },
    });
  }

  findActive(): Promise<Maintenance[]> {
    return this.maintenances.find({
      where: { status: In(ACTIVE_STATUSES) },
      relations: MAINTENANCE_RELATIONS,
      order: { scheduledAt: 'ASC' },
    });
  }

  findMine(userId: number): Promise<Maintenance[]> {
    return this.maintenances
      .createQueryBuilder('maintenance')
      .leftJoinAndSelect('maintenance.vehicle', 'vehicle')
      .leftJoinAndSelect('maintenance.mechanic', 'mechanic')
      .leftJoin('mechanic.user', 'user')
      .leftJoinAndSelect('maintenance.workshop', 'workshop')
      .where('user.id = :userId', { userId })
      .orderBy('maintenance.scheduledAt', 'ASC')
      .getMany();
  }

  findByVehicle(vehicleId: number): Promise<Maintenance[]> {
    return this.maintenances.find({
      where: { vehicle: { id: vehicleId } },
      relations: MAINTENANCE_RELATIONS,
      order: { scheduledAt: 'DESC' },
    });
  }

  findVehicleHistory(vehicleId: number): Promise<Maintenance[]> {
    return this.maintenances.find({
      where: {
        vehicle: { id: vehicleId },
        status: In([MaintenanceStatus.COMPLETED, MaintenanceStatus.CANCELLED]),
      },
      relations: MAINTENANCE_RELATIONS,
      order: { finishedAt: 'DESC', createdAt: 'DESC' },
    });
  }

  findByMechanic(mechanicId: number): Promise<Maintenance[]> {
    return this.maintenances.find({
      where: { mechanic: { id: mechanicId } },
      relations: MAINTENANCE_RELATIONS,
      order: { scheduledAt: 'DESC' },
    });
  }

  async updateStatus(
    id: number,
    dto: UpdateMaintenanceStatusDto,
    actor: AuthenticatedUser,
  ): Promise<Maintenance> {
    await this.dataSource.transaction(async (manager) => {
      const maintenances = manager.getRepository(Maintenance);
      const current = await maintenances.findOneBy({ id });
      if (!current) throw new NotFoundException('Mantenimiento no encontrado');

      // Mantener el orden vehículo -> mecánico -> mantenimiento evita interbloqueos
      // con la creación, que toma los locks de vehículo y mecánico en ese orden.
      const vehicles = manager.getRepository(Vehicle);
      const vehicle = await vehicles.findOne({
        where: { id: current.vehicleId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!vehicle) throw new NotFoundException('Vehículo no encontrado');

      const mechanics = manager.getRepository(Mechanic);
      const mechanic = await mechanics.findOne({
        where: { id: current.mechanicId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!mechanic) throw new NotFoundException('Mecánico no encontrado');
      const mechanicUser = mechanic.userId
        ? await manager.getRepository(User).findOneBy({ id: mechanic.userId })
        : null;
      if (actor.role !== UserRole.ADMIN && mechanicUser?.id !== actor.userId) {
        throw new ForbiddenException('Solo puedes actualizar mantenimientos asignados a tu cuenta');
      }

      const maintenance = await maintenances
        .createQueryBuilder('maintenance')
        .setLock('pessimistic_write')
        .where('maintenance.id = :id', { id })
        .getOne();
      if (!maintenance) throw new NotFoundException('Mantenimiento no encontrado');

      if (!isAllowedMaintenanceTransition(maintenance.status, dto.status)) {
        throw new BadRequestException(
          `Transición inválida de ${maintenance.status} a ${dto.status}`,
        );
      }

      if (dto.status === MaintenanceStatus.IN_PROGRESS) {
        const vehicleInProgress = await maintenances
          .createQueryBuilder('other')
          .where('other.vehicle_id = :vehicleId', { vehicleId: vehicle.id })
          .andWhere('other.id != :id', { id })
          .andWhere('other.status = :status', { status: MaintenanceStatus.IN_PROGRESS })
          .getOne();
        if (vehicleInProgress) {
          throw new ConflictException(`El vehículo ${vehicle.plate} ya tiene un mantenimiento en proceso`);
        }

        const mechanicInProgress = await maintenances
          .createQueryBuilder('other')
          .where('other.mechanic_id = :mechanicId', { mechanicId: mechanic.id })
          .andWhere('other.id != :id', { id })
          .andWhere('other.status = :status', { status: MaintenanceStatus.IN_PROGRESS })
          .getOne();
        if (mechanicInProgress) {
          throw new ConflictException('El mecánico ya tiene un mantenimiento en proceso');
        }

        const overlappingMaintenance = await maintenances
          .createQueryBuilder('other')
          .where('other.vehicle_id = :vehicleId', { vehicleId: vehicle.id })
          .andWhere('other.id != :id', { id })
          .andWhere('other.status = :status', { status: MaintenanceStatus.SCHEDULED })
          .andWhere('other.scheduled_at < :scheduledEndAt', {
            scheduledEndAt: maintenance.scheduledEndAt,
          })
          .andWhere('other.scheduled_end_at > :scheduledAt', {
            scheduledAt: maintenance.scheduledAt,
          })
          .getOne();
        if (overlappingMaintenance) {
          throw new ConflictException(
            `El vehículo ${vehicle.plate} tiene otro mantenimiento programado en ese horario`,
          );
        }
        vehicle.status = VehicleStatus.IN_MAINTENANCE;
      }

      if (dto.status === MaintenanceStatus.COMPLETED) {
        if (
          !dto.workPerformed?.trim() ||
          dto.finalCost === undefined ||
          !dto.finishedAt ||
          dto.finalMileage === undefined
        ) {
          throw new BadRequestException(
            'Para completar se requieren workPerformed, finalCost, finishedAt y finalMileage',
          );
        }
        if (dto.finalMileage < Math.max(vehicle.mileage, maintenance.mileage)) {
          throw new BadRequestException('El kilometraje final no puede ser inferior al registrado');
        }
        maintenance.workPerformed = dto.workPerformed.trim();
        maintenance.finalCost = dto.finalCost.toFixed(2);
        maintenance.finishedAt = new Date(dto.finishedAt);
        maintenance.finalMileage = dto.finalMileage;
        vehicle.mileage = dto.finalMileage;
        vehicle.status = VehicleStatus.AVAILABLE;
      }

      if (dto.status === MaintenanceStatus.CANCELLED) {
        if (maintenance.status === MaintenanceStatus.IN_PROGRESS) {
          vehicle.status = VehicleStatus.AVAILABLE;
        }
      }

      maintenance.status = dto.status;
      await vehicles.save(vehicle);
      await maintenances.save(maintenance);
    });

    return this.findOne(id);
  }

  async findOne(id: number): Promise<Maintenance> {
    const maintenance = await this.maintenances.findOne({
      where: { id },
      relations: MAINTENANCE_RELATIONS,
    });
    if (!maintenance) throw new NotFoundException('Mantenimiento no encontrado');
    return maintenance;
  }
}