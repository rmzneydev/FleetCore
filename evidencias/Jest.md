# Evidencia de pruebas con Jest

Resultados de las pruebas automatizadas de FleetCore, ejecutadas el 27 de octubre de 2026.

| Dato | Valor |
| --- | --- |
| Node.js | v26.1.0 |
| Jest | 30.5.2 (con `ts-jest` en modo ESM) |
| Suites unitarias | **13/13 aprobadas** |
| Tests unitarios | **37/37 aprobados** |
| Tests e2e | **1/1 aprobado** (contra PostgreSQL) |
| Cobertura global | **66,76 % sentencias · 61,4 % ramas · 68,91 % funciones · 68,25 % líneas** |
| Umbral exigido | 40 % (configurado en `coverageThreshold` de [jest.config.cjs](jest.config.cjs)) |

## Cómo reproducirlo

```bash
npm install
npm test            # pruebas unitarias
npm run test:cov    # pruebas unitarias + reporte de cobertura (falla si baja del 40 %)
npm run test:e2e    # e2e; requiere PostgreSQL accesible en localhost (p. ej. docker compose up -d)
```

El reporte HTML de cobertura queda en `coverage/lcov-report/index.html`.

## Resumen de la ejecución

```text
Test Suites: 13 passed, 13 total
Tests:       37 passed, 37 total
Snapshots:   0 total
Time:        2.749 s
Ran all test suites.
```

## Pruebas por funcionalidad

### Autenticación y autorización

| Suite | Prueba | Requisito que valida | Resultado |
| --- | --- | --- | --- |
| `auth.service.spec.ts` | El registro público siempre crea TECHNICIAN aunque se envíe un rol | Registro seguro; nadie se autoasigna ADMIN | Esperado |
| `auth.service.spec.ts` | Un administrador puede crear una cuenta ADMIN | Gestión de usuarios por rol | Esperado |
| `jwt-auth.guard.spec.ts` | Las rutas `@Public()` no pasan por Passport | Decorador `@Public()` | Esperado |
| `jwt-auth.guard.spec.ts` | Las rutas protegidas delegan en Passport (JWT) | Rutas privadas protegidas con Guards | Esperado |
| `roles.guard.spec.ts` | Permite el acceso si el usuario tiene uno de los roles requeridos | `@Roles()` + `RolesGuard` | Esperado |
| `roles.guard.spec.ts` | Rechaza (403) a un usuario sin el rol requerido | Sin acceso cuando el rol no corresponde | Esperado |
| `roles.guard.spec.ts` | Deja pasar si la ruta no declara roles | Comportamiento por defecto del guard | Esperado |
| `api-key.guard.spec.ts` | Acepta una clave incluida en la lista `API_KEYS` | Autenticación `x-api-key` desde variables de entorno | Esperado |
| `api-key.guard.spec.ts` | Rechaza una clave ausente (`undefined`) | Sin acceso sin API key | Esperado |
| `api-key.guard.spec.ts` | Rechaza una clave incorrecta (`wrong-key`) | Sin acceso con API key incorrecta | Esperado |
| `api-key.guard.spec.ts` | Rechaza todo si no hay claves configuradas | Configuración segura por defecto | Esperado |

### Respuestas y errores

| Suite | Prueba | Requisito que valida | Resultado |
| --- | --- | --- | --- |
| `response.interceptor.spec.ts` | Envuelve las respuestas exitosas en `{ success, statusCode, data, timestamp }` | Formato uniforme del interceptor | Esperado |
| `http-exception.filter.spec.ts` | Convierte la violación de unicidad de PostgreSQL (23505) en `409` | Errores de unicidad sin HTTP 500 | Esperado |
| `http-exception.filter.spec.ts` | Convierte la violación de clave foránea (23503) en `400` | Errores de referencia sin HTTP 500 | Esperado |
| `app.controller.spec.ts` | El endpoint raíz responde correctamente | Salud del servicio | Esperado |

### Gestión de vehículos, mecánicos y talleres

| Suite | Prueba | Requisito que valida | Resultado |
| --- | --- | --- | --- |
| `vehicles.service.spec.ts` | Rechaza poner `IN_MAINTENANCE` manualmente | La disponibilidad la controla el flujo de mantenimiento | Esperado |
| `vehicles.service.spec.ts` | Rechaza marcar `AVAILABLE` un vehículo con mantenimiento en proceso | Coherencia del estado del vehículo | Esperado |
| `vehicles.service.spec.ts` | Rechaza inactivar un vehículo con mantenimientos programados o en proceso | Inactivación sin romper mantenimientos activos | Esperado |
| `vehicles.service.spec.ts` | Inactiva un vehículo sin pendientes y luego lo reactiva | Eliminación lógica / inactivación | Esperado |
| `mechanics.service.spec.ts` | Acepta actualizar un mecánico manteniendo su misma cuenta de técnico | Vínculo técnico–mecánico | Esperado |
| `mechanics.service.spec.ts` | Rechaza vincular una cuenta de técnico ya usada por otro mecánico | Un técnico, un mecánico | Esperado |
| `mechanics.service.spec.ts` | Rechaza inactivar un mecánico con mantenimientos pendientes | Activar/inactivar mecánicos sin perder historial | Esperado |
| `workshops.service.spec.ts` | Lista solo talleres activos | Endpoint de talleres activos | Esperado |
| `workshops.service.spec.ts` | Responde `404` si el taller no existe | Código HTTP apropiado | Esperado |
| `workshops.service.spec.ts` | Rechaza inactivar un taller con mantenimientos pendientes | Activar/inactivar talleres | Esperado |
| `workshops.service.spec.ts` | Inactiva y reactiva un taller sin pendientes | Activar/inactivar talleres | Esperado |

### Mantenimientos y reglas de negocio

| Suite | Prueba | Requisito que valida | Resultado |
| --- | --- | --- | --- |
| `maintenance.rules.spec.ts` | `SCHEDULED` puede pasar a `IN_PROGRESS` o `CANCELLED` | Transiciones válidas | Esperado |
| `maintenance.rules.spec.ts` | `IN_PROGRESS` puede pasar a `COMPLETED` o `CANCELLED` | Transiciones válidas | Esperado |
| `maintenance.rules.spec.ts` | `COMPLETED` y `CANCELLED` son estados finales | Un `COMPLETED` no retrocede; un `CANCELLED` no se reactiva | Esperado |
| `maintenance.service.spec.ts` | Rechaza un intervalo con fin igual o anterior al inicio, sin abrir transacción | Validación de horarios | Esperado |
| `maintenance.service.spec.ts` | Rechaza iniciar si el **vehículo** ya tiene otro mantenimiento en proceso | Un vehículo, un mantenimiento activo | Esperado |
| `maintenance.service.spec.ts` | Rechaza iniciar si el **mecánico** ya tiene otro mantenimiento en proceso | Un técnico, un mantenimiento activo | Esperado |
| `maintenance.service.spec.ts` | Un técnico no puede actualizar un mantenimiento asignado a otro | El técnico solo gestiona lo asignado | Esperado |
| `maintenance.service.spec.ts` | Cancelar un `SCHEDULED` mantiene la disponibilidad del vehículo y registra la auditoría | Disponibilidad + auditoría de estados | Esperado |
| `maintenance.service.spec.ts` | Cancelar un `IN_PROGRESS` devuelve el vehículo a `AVAILABLE` y registra la auditoría | Disponibilidad + auditoría de estados | Esperado |

### Integración externa

| Suite | Prueba | Requisito que valida | Resultado |
| --- | --- | --- | --- |
| `integrations.service.spec.ts` | Devuelve solo los campos públicos del vehículo y el historial completado | Contrato del endpoint con `x-api-key` | Esperado |
| `integrations.service.spec.ts` | Responde `404` para una placa inexistente | Código HTTP apropiado | Esperado |

### Prueba e2e

| Suite | Prueba | Resultado |
| --- | --- | --- |
| `test/app.e2e-spec.ts` | `GET /` levanta la aplicación completa contra PostgreSQL y responde `200` con el formato uniforme | Esperado |

## Reporte de cobertura (`npm run test:cov`)

```text
-----------------------------|---------|----------|---------|---------|------------------------------------
File                         | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
-----------------------------|---------|----------|---------|---------|------------------------------------
All files                    |   66.76 |     61.4 |   68.91 |   68.25 |
 auth                        |   66.66 |       56 |   77.77 |   67.85 |
  auth.service.ts            |   66.66 |       56 |   77.77 |   67.85 | 40,52-69
 common/decorators           |    62.5 |      100 |   33.33 |   66.66 |
  current-user.decorator.ts  |       0 |      100 |       0 |       0 | 4-6
  public.decorator.ts        |     100 |      100 |     100 |     100 |
  roles.decorator.ts         |   66.66 |      100 |       0 |     100 |
 common/filters              |      80 |    41.66 |     100 |   78.94 |
  http-exception.filter.ts   |      80 |    41.66 |     100 |   78.94 | 36-40
 common/guards               |     100 |    88.46 |     100 |     100 |
  api-key.guard.ts           |     100 |       90 |     100 |     100 | 13
  jwt-auth.guard.ts          |     100 |    83.33 |     100 |     100 | 12
  roles.guard.ts             |     100 |       90 |     100 |     100 | 16
 common/interceptors         |     100 |      100 |     100 |     100 |
  response.interceptor.ts    |     100 |      100 |     100 |     100 |
 common/swagger              |   66.66 |        0 |   33.33 |   66.66 |
  api-responses.decorator.ts |   66.66 |        0 |   33.33 |   66.66 | 56-58
 integrations                |     100 |       75 |     100 |     100 |
  integrations.service.ts    |     100 |       75 |     100 |     100 | 12,43
 maintenance                 |   45.13 |    43.05 |   43.75 |   48.07 |
  maintenance.rules.ts       |     100 |      100 |     100 |     100 |
  maintenance.service.ts     |   44.14 |    43.05 |      40 |   47.05 | 48-172,219,245-262,266-284,305-313
 mechanics                   |    67.5 |    72.22 |   66.66 |   72.22 |
  mechanics.service.ts       |    67.5 |    72.22 |   66.66 |   72.22 | 22-38,58-59,84,91
 vehicles                    |    64.1 |    64.28 |      60 |   68.57 |
  vehicles.service.ts        |    64.1 |    64.28 |      60 |   68.57 | 19-40,74
 workshops                   |   95.65 |     87.5 |    87.5 |   95.23 |
  workshops.service.ts       |   95.65 |     87.5 |    87.5 |   95.23 | 19
-----------------------------|---------|----------|---------|---------|------------------------------------
```

**Alcance de la cobertura:** se miden la lógica de negocio y la infraestructura transversal: servicios, reglas, guards, filtro, interceptor y decoradores. Quedan fuera los archivos declarativos o de arranque (controllers, DTOs, entidades, enums, módulos, migraciones, `main.ts` y `seed.ts`). Sus rutas y validaciones se verificaron de extremo a extremo con Swagger;

**Líneas de `maintenance.service.ts` sin cubrir:** son la creación transaccional con locks y las consultas de listado y auditoría. Dependen de PostgreSQL (locks pesimistas, consultas con solapamiento de horarios) y se validaron manualmente contra la base real: creación `201`, solapamiento `409`, inicio y cierre `200` con cambio de disponibilidad del vehículo, auditoría `200` y acceso de técnico a auditoría `403`.
