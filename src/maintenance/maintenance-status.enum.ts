export enum MaintenanceStatus {
  SCHEDULED = 'SCHEDULED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

// Estados que ocupan al vehículo, mecánico o taller y bloquean su inactivación.
export const ACTIVE_MAINTENANCE_STATUSES = [
  MaintenanceStatus.SCHEDULED,
  MaintenanceStatus.IN_PROGRESS,
] as const;
