import { hash } from 'bcryptjs';
import dataSource from './database/data-source.js';
import { User } from './auth/user.entity.js';
import { UserRole } from './auth/role.enum.js';
import { Maintenance } from './maintenance/entities/maintenance.entity.js';
import { MaintenanceStatusLog } from './maintenance/entities/maintenance-status-log.entity.js';
import { MaintenanceStatus } from './maintenance/maintenance-status.enum.js';
import { MaintenanceType } from './maintenance/maintenance-type.enum.js';
import { Mechanic } from './mechanics/entities/mechanic.entity.js';
import { MechanicStatus } from './mechanics/mechanic-status.enum.js';
import { Vehicle } from './vehicles/entities/vehicle.entity.js';
import { VehicleStatus } from './vehicles/vehicle-status.enum.js';
import { Workshop } from './workshops/entities/workshop.entity.js';
import { WorkshopStatus } from './workshops/workshop-status.enum.js';

const DEMO_USERS = [
  {
    email: 'seed.admin@fleetcore.test',
    role: UserRole.ADMIN,
    password: process.env.SEED_ADMIN_PASSWORD ?? 'FleetCoreAdmin123!',
  },
  {
    email: 'seed.technician1@fleetcore.test',
    role: UserRole.TECHNICIAN,
    password: process.env.SEED_TECHNICIAN_ONE_PASSWORD ?? 'FleetCoreTech123!',
  },
  {
    email: 'seed.technician2@fleetcore.test',
    role: UserRole.TECHNICIAN,
    password: process.env.SEED_TECHNICIAN_TWO_PASSWORD ?? 'FleetCoreTech456!',
  },
] as const;

// Recorrido de estados que se registra en auditoría para cada mantenimiento demo.
const STATUS_PATHS: Record<MaintenanceStatus, MaintenanceStatus[]> = {
  [MaintenanceStatus.SCHEDULED]: [MaintenanceStatus.SCHEDULED],
  [MaintenanceStatus.IN_PROGRESS]: [MaintenanceStatus.SCHEDULED, MaintenanceStatus.IN_PROGRESS],
  [MaintenanceStatus.COMPLETED]: [
    MaintenanceStatus.SCHEDULED,
    MaintenanceStatus.IN_PROGRESS,
    MaintenanceStatus.COMPLETED,
  ],
  [MaintenanceStatus.CANCELLED]: [MaintenanceStatus.SCHEDULED, MaintenanceStatus.CANCELLED],
};

async function seed(): Promise<void> {
  await dataSource.initialize();
  try {
    await dataSource.runMigrations();
    await dataSource.transaction(async (manager) => {
      const usersRepository = manager.getRepository(User);
      const mechanicsRepository = manager.getRepository(Mechanic);
      const workshopsRepository = manager.getRepository(Workshop);
      const vehiclesRepository = manager.getRepository(Vehicle);
      const maintenancesRepository = manager.getRepository(Maintenance);
      const statusLogsRepository = manager.getRepository(MaintenanceStatusLog);

      const userByEmail = new Map<string, User>();
      const rounds = Number(process.env.BCRYPT_SALT_ROUNDS ?? 10);
      for (const demoUser of DEMO_USERS) {
        let user = await usersRepository.findOneBy({ email: demoUser.email });
        if (!user) {
          user = usersRepository.create({
            email: demoUser.email,
            role: demoUser.role,
            passwordHash: await hash(demoUser.password, rounds),
          });
        } else {
          user.role = demoUser.role;
        }
        userByEmail.set(demoUser.email, await usersRepository.save(user));
      }

      await mechanicsRepository
        .createQueryBuilder()
        .update(Mechanic)
        .set({ user: null })
        .where('user_id IN (:...userIds)', {
          userIds: DEMO_USERS.slice(1).map((demoUser) => userByEmail.get(demoUser.email)!.id),
        })
        .execute();

      const mechanicData = [
        {
          email: 'seed.mechanic1@fleetcore.test',
          name: 'Carlos Pérez',
          specialty: 'Motor diésel',
          status: MechanicStatus.ACTIVE,
          user: userByEmail.get(DEMO_USERS[1].email)!,
        },
        {
          email: 'seed.mechanic2@fleetcore.test',
          name: 'Laura Gómez',
          specialty: 'Frenos y suspensión',
          status: MechanicStatus.ACTIVE,
          user: userByEmail.get(DEMO_USERS[2].email)!,
        },
        {
          email: 'seed.mechanic3@fleetcore.test',
          name: 'Andrés Ruiz',
          specialty: 'Electricidad automotriz',
          status: MechanicStatus.INACTIVE,
          user: null,
        },
      ];
      const mechanicsByEmail = new Map<string, Mechanic>();
      for (const mechanicDataItem of mechanicData) {
        let mechanic = await mechanicsRepository.findOne({
          where: { email: mechanicDataItem.email },
          relations: { user: true },
        });
        if (!mechanic) mechanic = mechanicsRepository.create();
        Object.assign(mechanic, mechanicDataItem);
        mechanicsByEmail.set(mechanic.email, await mechanicsRepository.save(mechanic));
      }

      const workshopData = [
        {
          name: 'Taller Centro',
          address: 'Av. Principal 100, Bogotá',
          status: WorkshopStatus.ACTIVE,
        },
        {
          name: 'Taller Norte',
          address: 'Calle 80 #20-15, Bogotá',
          status: WorkshopStatus.INACTIVE,
        },
      ];
      const workshopsByName = new Map<string, Workshop>();
      for (const workshopDataItem of workshopData) {
        let workshop = await workshopsRepository.findOneBy({ name: workshopDataItem.name });
        if (!workshop) workshop = workshopsRepository.create();
        Object.assign(workshop, workshopDataItem);
        workshopsByName.set(workshop.name, await workshopsRepository.save(workshop));
      }

      const vehicleData = [
        { plate: 'SEED-001', brand: 'Chevrolet', model: 'NPR', year: 2022, mileage: 45000, status: VehicleStatus.AVAILABLE },
        { plate: 'SEED-002', brand: 'Hino', model: '300', year: 2023, mileage: 28000, status: VehicleStatus.AVAILABLE },
        { plate: 'SEED-003', brand: 'Foton', model: 'Aumark', year: 2021, mileage: 62000, status: VehicleStatus.IN_MAINTENANCE },
        { plate: 'SEED-004', brand: 'JAC', model: 'HFC', year: 2020, mileage: 81000, status: VehicleStatus.INACTIVE },
      ];
      const vehiclesByPlate = new Map<string, Vehicle>();
      for (const vehicleDataItem of vehicleData) {
        let vehicle = await vehiclesRepository.findOneBy({ plate: vehicleDataItem.plate });
        if (!vehicle) vehicle = vehiclesRepository.create();
        Object.assign(vehicle, vehicleDataItem);
        vehiclesByPlate.set(vehicle.plate, await vehiclesRepository.save(vehicle));
      }

      const maintenanceData = [
        {
          type: MaintenanceType.PREVENTIVE,
          description: 'Cambio preventivo de aceite y filtros',
          mileage: 45000,
          scheduledAt: new Date('2026-10-10T13:00:00.000Z'),
          scheduledEndAt: new Date('2026-10-10T15:00:00.000Z'),
          status: MaintenanceStatus.COMPLETED,
          workPerformed: 'Cambio de aceite, filtros y revisión general',
          finalCost: '350000.00',
          finishedAt: new Date('2026-10-10T14:45:00.000Z'),
          finalMileage: 45000,
          vehicle: vehiclesByPlate.get('SEED-001')!,
          mechanic: mechanicsByEmail.get('seed.mechanic1@fleetcore.test')!,
          workshop: workshopsByName.get('Taller Centro')!,
        },
        {
          type: MaintenanceType.CORRECTIVE,
          description: 'Diagnóstico y reparación de sistema de transmisión',
          mileage: 62000,
          scheduledAt: new Date('2026-10-27T13:00:00.000Z'),
          scheduledEndAt: new Date('2026-10-27T17:00:00.000Z'),
          status: MaintenanceStatus.IN_PROGRESS,
          workPerformed: null,
          finalCost: null,
          finishedAt: null,
          finalMileage: null,
          vehicle: vehiclesByPlate.get('SEED-003')!,
          mechanic: mechanicsByEmail.get('seed.mechanic2@fleetcore.test')!,
          workshop: workshopsByName.get('Taller Centro')!,
        },
      ];

      for (const maintenanceDataItem of maintenanceData) {
        const existing = await maintenancesRepository.findOne({
          where: {
            vehicle: { id: maintenanceDataItem.vehicle.id },
            description: maintenanceDataItem.description,
            scheduledAt: maintenanceDataItem.scheduledAt,
          },
        });
        const maintenance = existing ?? maintenancesRepository.create();
        Object.assign(maintenance, maintenanceDataItem);
        const savedMaintenance = await maintenancesRepository.save(maintenance);

        // Solo se crea la auditoría la primera vez para no duplicarla al reejecutar el seed.
        if (await statusLogsRepository.existsBy({ maintenance: { id: savedMaintenance.id } })) continue;
        const path = STATUS_PATHS[savedMaintenance.status];
        await statusLogsRepository.save(
          path.map((toStatus, index) =>
            statusLogsRepository.create({
              maintenance: savedMaintenance,
              fromStatus: index === 0 ? null : path[index - 1],
              toStatus,
              changedBy: userByEmail.get(DEMO_USERS[0].email)!,
            }),
          ),
        );
      }
    });

    console.info('FleetCore demo data seeded successfully.');
    console.info('Demo accounts: seed.admin@fleetcore.test, seed.technician1@fleetcore.test, seed.technician2@fleetcore.test');
    console.info('Demo passwords: see README; set SEED_*_PASSWORD variables to override defaults.');
  } finally {
    await dataSource.destroy();
  }
}

await seed();