# OpsCommand


Todo : 
 Ensure /me endpoints are accessible to any authenticated user (controller-level authorize setup)
 Return Identity errors in API responses (username taken, invalid email, password rules)
 Add rule checks: one user can be assigned to only one squad; commanderId requires Commander/Admin/SuperAdmin role
 Add check: Admin cannot promote to Admin/SuperAdmin (only SuperAdmin can)

Squads
 Add commander role validation when setting CommanderId
 Add Squad type restriction (Assault/Tactical/Recon) as enum + validation
 Prevent deleting squad if active missions exist (later)

Missions (first)
 Mission CRUD + status transitions
 Join mission - squads (MissionSquad)

 Business rules:
 Squad cannot be in more than one ACTIVE mission
 Commander cannot have more than one ACTIVE mission

Equipment (second)
 Equipment CRUD
 SquadEquipment CRUD (quantity)
 UserEquipment (later)
