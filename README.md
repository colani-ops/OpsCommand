# OpsCommand

Backend API for a tactical operations management system.
Built with ASP.NET Core, Entity Framework Core and Identity.

## Status
Active development – core domain logic implemented, equipment vertical slice pending.

---

## Implemented Features

### Authentication & Authorization
- ASP.NET Core Identity
- Role-based access control:
  - SuperAdmin
  - Admin
  - Commander
  - Member
  - Recruit

---

### Squads
- Squad CRUD (soft delete)
- Allowed squad types:
  - Assault
  - Tactical
  - Recon
- Commander assignment with validation:
  - User must exist
  - User must have Commander role
  - User must not be locked out
- One squad - one commander
- Soft delete via `DeletedAt`

---

### Missions
- Mission CRUD (soft delete)
- Mission status flow:
  - Prepared -> Planned -> Active -> Completed / Cancelled (Updated in real time on the frontend, later)
- Business rules enforced:
  - Mission cannot become Active without a commander
  - Commander cannot be changed while mission is Active
  - Completed / Cancelled missions are immutable
- Assign commander endpoint for missions
- GetMyMissions logic:
  - Commander -> missions where user is commander
  - Other users -> missions via assigned squad

---

## TODO / Next Steps

### Equipment (next vertical slice)
- Equipment CRUD
- SquadEquipment (many-to-many with quantity)
- Business rules:
  - Equipment availability constraints
  - Mission-related equipment locking (later)

### Enhancements
- Enforce: one user → one squad (hard constraint)
- Prevent deleting squad if active missions exist
- Improve API error responses (Identity errors)
- Add enums for mission status & squad type
- Frontend integration

---
