import { MaintenanceStatus } from './maintenance-status.enum.js';

const ALLOWED_TRANSITIONS: Record<MaintenanceStatus, readonly MaintenanceStatus[]> = {
  [MaintenanceStatus.SCHEDULED]: [MaintenanceStatus.IN_PROGRESS, MaintenanceStatus.CANCELLED],
  [MaintenanceStatus.IN_PROGRESS]: [MaintenanceStatus.COMPLETED, MaintenanceStatus.CANCELLED],
  [MaintenanceStatus.COMPLETED]: [],
  [MaintenanceStatus.CANCELLED]: [],
};

export function isAllowedMaintenanceTransition(
  current: MaintenanceStatus,
  next: MaintenanceStatus,
): boolean {
  return ALLOWED_TRANSITIONS[current].includes(next);
}