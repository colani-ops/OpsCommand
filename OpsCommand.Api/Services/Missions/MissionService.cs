using Microsoft.AspNetCore.Identity;
using OpsCommand.Api.Domain.Entities;
using OpsCommand.Api.Models.Missions;
using OpsCommand.Api.Repositories.Missions;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using OpsCommand.Api.Repositories.Squads;
using OpsCommand.Api.Repositories.SquadEquipments;

namespace OpsCommand.Api.Services.Missions
{
    public class MissionService : IMissionService
    {
        private readonly IMissionRepository _missionRepository;
        private readonly UserManager<ApplicationUser> _userManager;

        private readonly ISquadRepository _squadRepository;
        private readonly ISquadEquipmentRepository _squadEquipmentRepository;

        public MissionService(
            IMissionRepository missionRepository,
            UserManager<ApplicationUser> userManager,
            ISquadRepository squadRepository,
            ISquadEquipmentRepository squadEquipmentRepository)
        {
            _missionRepository = missionRepository;
            _userManager = userManager;
            _squadRepository = squadRepository;
            _squadEquipmentRepository = squadEquipmentRepository;
        }

        private static readonly String[] AllowedStates = new[]
        {
            "Prepared",
            "Planned",
            "Active",
            "Completed",
            "Cancelled"
        };
        private static MissionResponseDto MapToDto(Mission mission)
        {
            return new MissionResponseDto
            {
                Id = mission.Id,
                Name = mission.Name,
                Status = mission.Status,
                CommanderId = mission.CommanderId,
                CreatedAt = mission.CreatedAt,
                CreatedByUserId = mission.CreatedByUserId,
                Notes = mission.Notes,
                SquadId = mission.SquadId,
                Terrain = mission.Terrain,
                Difficulty = mission.Difficulty,
                SuccessChanceSnapshot = mission.SuccessChanceSnapshot,
                WasSuccessful = mission.WasSuccessful,
                ExecutedAt = mission.ExecutedAt
            };
        }



        public async Task<List<MissionResponseDto>> GetAllAsync()
        {
            var missions = await _missionRepository.GetAllAsync();
            return missions.Select(MapToDto).ToList();
        }



        public async Task<MissionResponseDto?> GetByIdAsync(int id)
        {
            var mission = await _missionRepository.GetByIdAsync(id);

            if (mission == null)
                return null;

            return MapToDto(mission);
        }



        public async Task<MissionResponseDto> CreateAsync(MissionCreateDto dto, string createdByUserId)
        {
            ApplicationUser? commander = null;

            if (!string.IsNullOrWhiteSpace(dto.CommanderId))
            {
                commander = await _userManager.FindByIdAsync(dto.CommanderId);
                if (commander == null)
                    throw new ArgumentException("Commander user not found.");

                if (await _userManager.IsLockedOutAsync(commander))
                    throw new ArgumentException("Commander is inactive");

                var isCommander = await _userManager.IsInRoleAsync(commander, "Commander");
                if (!isCommander)
                    throw new ArgumentException("User is not eligible to be a commander");

                if (commander.AssignedSquadId == null)
                    throw new ArgumentException("Commander must be assigned to a squad before mission creation.");
            }

            var hasCommander = commander != null;

            var mission = new Mission
            {
                Name = dto.Name,
                Status = hasCommander ? "Planned" : "Prepared",
                CommanderId = hasCommander ? commander!.Id : null,
                SquadId = hasCommander ? commander!.AssignedSquadId : null,
                CreatedAt = DateTime.UtcNow,
                CreatedByUserId = createdByUserId,
                Notes = dto.Notes,
                Terrain = dto.Terrain,
                Difficulty = dto.Difficulty
            };

            await _missionRepository.AddAsync(mission);

            return MapToDto(mission);
        }



        public async Task<MissionResponseDto?> UpdateAsync(int id, MissionUpdateDto dto)
        {
            if (!string.IsNullOrWhiteSpace(dto.CommanderId) || dto.ClearCommander)
                throw new ArgumentException("Use /commander endpoint to assign/unassign commander.");

            var mission = await _missionRepository.GetByIdAsync(id);
            if (mission == null) return null;

            var isTerminal = mission.Status is "Completed";

            // notes uvijek smije
            if (dto.Notes != null)
                mission.Notes = dto.Notes;

            // Ako je terminal, ne diraj ništa drugo
            if (isTerminal)
            {
                // ako user pokušava mijenjati Name/Status, javi poruku
                if (!string.IsNullOrWhiteSpace(dto.Name) || dto.Status != null)
                    throw new ArgumentException($"Can't edit mission fields when status is '{mission.Status}'. Only Notes can be updated.");

                await _missionRepository.UpdateAsync(mission);
                return MapToDto(mission);
            }

            // normal edits
            if (!string.IsNullOrWhiteSpace(dto.Name))
                mission.Name = dto.Name;

            if (dto.Status != null)
                throw new ArgumentException("Use mission action routes to change status.");

            if (!string.IsNullOrWhiteSpace(dto.Terrain))
                mission.Terrain = dto.Terrain;

            if (!string.IsNullOrWhiteSpace(dto.Difficulty))
                mission.Difficulty = dto.Difficulty;

            await _missionRepository.UpdateAsync(mission);
            return MapToDto(mission);
        }



        public async Task<bool> DeleteAsync(int id)
        {
            var mission = await _missionRepository.GetByIdAsync(id);

            if (mission == null)
            {
                return false;
            }

            await _missionRepository.DeleteAsync(mission);
            return true;
        }



        public async Task<List<MissionResponseDto>> GetMyMissionsAsync(string userId)
        {
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null) return new List<MissionResponseDto>();

            // Ako je commander -> misije gdje je commander
            var isCommander = await _userManager.IsInRoleAsync(user, "Commander");
            if (isCommander)
            {
                var all = await _missionRepository.GetAllAsync();
                return all
                    .Where(m => m.CommanderId == userId)
                    .Select(MapToDto)
                    .ToList();
            }

            // Ostali -> misije preko njihovog squada
            if (user.AssignedSquadId == null)
                return new List<MissionResponseDto>();

            var missions = await _missionRepository.GetBySquadIdAsync(user.AssignedSquadId.Value);
            return missions.Select(MapToDto).ToList();
        }




        // WILL IMPLEMENT PROPERLY LATER

        public async Task<MissionResponseDto?> AssignCommanderAsync(int missionId, string commanderId)
        {
            if (string.IsNullOrWhiteSpace(commanderId))
                throw new ArgumentException("CommanderId is required.");

            var mission = await _missionRepository.GetByIdAsync(missionId);
            if (mission == null)
                return null;

            var commander = await _userManager.FindByIdAsync(commanderId);
            if (commander == null)
                throw new ArgumentException("Commander user not found.");

            //disabled user check
            if (await _userManager.IsLockedOutAsync(commander))
                throw new ArgumentException("Commander is inactive/disabled.");

            if (mission.CommanderId == commanderId) return MapToDto(mission);

            //role check
            var isCommander = await _userManager.IsInRoleAsync(commander, "Commander");
            if (!isCommander)
                throw new ArgumentException("User is not eligible to be a commander.");

            //status check
            if (mission.Status == "Completed")
                throw new ArgumentException("Cannot assign commander to a completed mission.");

            if (mission.Status == "Active")
                throw new ArgumentException("Cannot change commander while mission is Active.");

            // commander mora imati squad
            if (commander.AssignedSquadId == null)
                throw new ArgumentException("Commander must be assigned to a squad before being assigned to a mission.");

            var commanderSquadId = commander.AssignedSquadId.Value;

            // 1 misija - 1 squad
            if (mission.SquadId != null && mission.SquadId.Value != commanderSquadId)
                throw new ArgumentException("Mission is already assigned to a different squad.");



            //assign
            mission.CommanderId = commanderId;
            mission.SquadId = commanderSquadId;

            // If mission now has a commander, move it into Planned
            if (mission.Status == "Prepared")
                mission.Status = "Planned";

            if (mission.Status == "Cancelled")
                mission.Status = "Planned";

            await _missionRepository.UpdateAsync(mission);

            return MapToDto(mission);
        }



        public async Task<MissionResponseDto?> UnassignCommanderAsync(int missionId)
        {
            var mission = await _missionRepository.GetByIdAsync(missionId);
            if (mission == null) return null;

            // guardrails
            if (mission.Status == "Completed")
                throw new ArgumentException("Cannot modify a completed mission.");

            if (mission.Status == "Active")
                throw new ArgumentException("Cannot unassign commander while mission is Active.");

            mission.CommanderId = null;
            mission.SquadId = null;
            mission.Status = "Prepared"; // vraćamo u pool

            await _missionRepository.UpdateAsync(mission);
            return MapToDto(mission);
        }

        public async Task<MissionResponseDto?> ActivateAsync(int missionId)
        {
            var mission = await _missionRepository.GetByIdAsync(missionId);
            if (mission == null) return null;

            if (mission.Status is "Completed" or "Cancelled")
                throw new ArgumentException($"Cannot activate mission when status is '{mission.Status}'.");

            if (string.IsNullOrWhiteSpace(mission.CommanderId))
                throw new ArgumentException("Cannot activate mission without a commander.");

            if (mission.Status != "Planned")
                throw new ArgumentException("Only Planned missions can be activated.");

            var activeForCommander = await _missionRepository
                .GetActiveByCommanderIdAsync(mission.CommanderId!, excludeMissionId: mission.Id);
            if (activeForCommander != null)
                throw new ArgumentException("Commander already has an active mission.");

            if (mission.SquadId != null)
            {
                var activeForSquad = await _missionRepository
                    .GetActiveBySquadIdAsync(mission.SquadId.Value, excludeMissionId: mission.Id);
                if (activeForSquad != null)
                    throw new ArgumentException("Squad already has an active mission.");
            }

            mission.Status = "Active";
            await _missionRepository.UpdateAsync(mission);
            return MapToDto(mission);
        }

        public async Task<MissionResponseDto?> CompleteAsync(int missionId, string? notes)
        {
            var mission = await _missionRepository.GetByIdAsync(missionId);
            if (mission == null) return null;

            if (mission.Status != "Active")
                throw new ArgumentException("Only Active missions can be completed.");

            if (string.IsNullOrWhiteSpace(mission.CommanderId))
                throw new ArgumentException("Cannot complete mission without a commander.");

            if (notes != null) mission.Notes = notes;

            mission.Status = "Completed";
            await _missionRepository.UpdateAsync(mission);
            return MapToDto(mission);
        }

        public async Task<MissionResponseDto?> CancelAsync(int missionId, string? notes)
        {
            var mission = await _missionRepository.GetByIdAsync(missionId);
            if (mission == null) return null;

            if (mission.Status == "Completed")
                throw new ArgumentException("Cannot cancel a completed mission.");

            mission.Status = "Cancelled";
            if (notes != null) mission.Notes = notes;

            // release resources
            mission.CommanderId = null;
            mission.SquadId = null;

            await _missionRepository.UpdateAsync(mission);
            return MapToDto(mission);
        }

        private static readonly string[] AllowedTerrains = new[]
        {
            "Urban",
            "Plains",
            "Forest",
            "Mountain"
        };

        private static readonly string[] AllowedDifficulties = new[]
        {
            "Low",
            "Medium",
            "High"
        };

        private static int GetDifficultyModifier(string difficulty) => difficulty switch
        {
            "Low" => 15,
            "Medium" => 0,
            "High" => -15,
            _ => 0
        };

        private static double GetTerrainMultiplier(string terrain, string? category) => terrain switch
        {
            "Urban" => category switch
            {
                "Utility" => 1.2,
                "Primary" => 1.1,
                "Secondary" => 1.0,
                "Melee" => 0.9,
                _ => 1.0
            },
            "Plains" => category switch
            {
                "Primary" => 1.3,
                "Secondary" => 1.0,
                "Utility" => 0.9,
                "Melee" => 0.7,
                _ => 1.0
            },
            "Forest" => category switch
            {
                "Utility" => 1.2,
                "Melee" => 1.1,
                "Primary" => 1.0,
                "Secondary" => 0.9,
                _ => 1.0
            },
            "Mountain" => category switch
            {
                "Utility" => 1.3,
                "Primary" => 1.0,
                "Secondary" => 0.9,
                "Melee" => 0.8,
                _ => 1.0
            },
            _ => 1.0
        };

        public async Task<MissionExecutionResponseDto?> ExecuteAsync(int missionId)
        {
            var mission = await _missionRepository.GetByIdAsync(missionId);
            if (mission == null)
                return null;

            if (mission.Status != "Active")
                throw new ArgumentException("Only Active missions can be executed.");

            if (mission.SquadId == null)
                throw new ArgumentException("Mission must have an assigned squad before execution.");

            if (string.IsNullOrWhiteSpace(mission.Terrain) || !AllowedTerrains.Contains(mission.Terrain))
                throw new ArgumentException("Mission terrain is missing or invalid.");

            if (string.IsNullOrWhiteSpace(mission.Difficulty) || !AllowedDifficulties.Contains(mission.Difficulty))
                throw new ArgumentException("Mission difficulty is missing or invalid.");

            var squad = await _squadRepository.GetByIdAsync(mission.SquadId.Value);
            if (squad == null)
                throw new ArgumentException("Assigned squad not found.");

            var squadEquipment = await _squadEquipmentRepository.GetBySquadIdAsync(squad.Id);

            const int baseScore = 50;

            var difficultyModifier = GetDifficultyModifier(mission.Difficulty);
            var modifierScore = difficultyModifier;

            double rawEquipmentScore = 0;

            foreach (var se in squadEquipment)
            {
                var effectiveness = se.Equipment.Effectiveness;
                var quantity = se.Quantity;
                var multiplier = GetTerrainMultiplier(mission.Terrain, se.Equipment.Category);

                rawEquipmentScore += effectiveness * quantity * multiplier;
            }

            var equipmentScore = (int)Math.Min(30, Math.Round(rawEquipmentScore / 20.0));

            var finalScore = baseScore + modifierScore + equipmentScore;

            if (finalScore < 0) finalScore = 0;
            if (finalScore > 95) finalScore = 95;

            var successChance = finalScore;
            var roll = Random.Shared.Next(1, 101);
            var wasSuccessful = roll <= successChance;

            mission.SuccessChanceSnapshot = successChance;
            mission.WasSuccessful = wasSuccessful;
            mission.ExecutedAt = DateTime.UtcNow;
            mission.Status = "Completed";

            var outcomeText = wasSuccessful ? "Mission succeeded." : "Mission failed.";

            var executionSummary =
                $"{outcomeText}\n" +
                $"Success chance: {successChance}%\n" +
                $"Base score: {baseScore}\n" +
                $"Equipment score: {equipmentScore}\n" +
                $"Modifier score: {modifierScore}\n" +
                $"Final score: {finalScore}\n" +
                $"Executed at: {mission.ExecutedAt:yyyy-MM-dd HH:mm:ss} UTC";

            mission.Notes = string.IsNullOrWhiteSpace(mission.Notes)
                ? executionSummary
                : $"{mission.Notes}\n\n{executionSummary}";

            squad.MissionsServed += 1;
            if (wasSuccessful)
                squad.MissionsWon += 1;

            await _missionRepository.UpdateAsync(mission);
            await _squadRepository.UpdateAsync(squad);

            return new MissionExecutionResponseDto
            {
                MissionId = mission.Id,
                MissionName = mission.Name,
                Terrain = mission.Terrain,
                Difficulty = mission.Difficulty,
                BaseScore = baseScore,
                EquipmentScore = equipmentScore,
                ModifierScore = modifierScore,
                FinalScore = finalScore,
                SuccessChance = successChance,
                WasSuccessful = wasSuccessful,
                Outcome = wasSuccessful ? "Success" : "Failure"
            };
        }
    }
}