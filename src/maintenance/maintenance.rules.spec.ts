import { MaintenanceStatus } from './maintenance-status.enum.js';
import { isAllowedMaintenanceTransition } from './maintenance.rules.js';

describe('maintenance status transitions', () => {
  it('allows scheduled maintenance to start or be cancelled', () => {
    expect(
      isAllowedMaintenanceTransition(MaintenanceStatus.SCHEDULED, MaintenanceStatus.IN_PROGRESS),
    ).toBe(true);
    expect(
      isAllowedMaintenanceTransition(MaintenanceStatus.SCHEDULED, MaintenanceStatus.CANCELLED),
    ).toBe(true);
  });

  it('allows an in-progress maintenance to complete or be cancelled', () => {
    expect(
      isAllowedMaintenanceTransition(MaintenanceStatus.IN_PROGRESS, MaintenanceStatus.COMPLETED),
    ).toBe(true);
    expect(
      isAllowedMaintenanceTransition(MaintenanceStatus.IN_PROGRESS, MaintenanceStatus.CANCELLED),
    ).toBe(true);
  });

  it('keeps completed and cancelled states terminal', () => {
    for (const terminal of [MaintenanceStatus.COMPLETED, MaintenanceStatus.CANCELLED]) {
      for (const next of Object.values(MaintenanceStatus)) {
        expect(isAllowedMaintenanceTransition(terminal, next)).toBe(false);
      }
    }
  });
});