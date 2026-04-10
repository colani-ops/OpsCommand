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

        private static MissionResponseDto MapToDto(Mission mission)
        {
            return new MissionResponseDto
            {
                Id = mission.Id,
                Name = mission.Name.Trim(),
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

            if (string.IsNullOrWhiteSpace(dto.Name))
                throw new ArgumentException("Mission name is required.");

            if (!string.IsNullOrWhiteSpace(dto.Terrain) && !AllowedTerrains.Contains(dto.Terrain))
                throw new ArgumentException("Invalid terrain.");

            if (!string.IsNullOrWhiteSpace(dto.Difficulty) && !AllowedDifficulties.Contains(dto.Difficulty))
                throw new ArgumentException("Invalid difficulty.");

            var mission = new Mission
            {
                Name = dto.Name.Trim(),
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
            var mission = await _missionRepository.GetByIdAsync(id);
            if (mission == null) return null;

            var isCompleted = mission.Status == "Completed";
            var isActive = mission.Status == "Active";

            var canEditCore =
                mission.Status == "Prepared" ||
                mission.Status == "Planned" ||
                mission.Status == "Cancelled";

            // Notes are always allowed
            if (dto.Notes != null)
                mission.Notes = dto.Notes;

            // Completed = notes-only
            if (isCompleted)
            {
                if (!string.IsNullOrWhiteSpace(dto.Name)
                    || !string.IsNullOrWhiteSpace(dto.Terrain)
                    || !string.IsNullOrWhiteSpace(dto.Difficulty))
                {
                    throw new ArgumentException("Completed missions allow notes-only updates.");
                }

                await _missionRepository.UpdateAsync(mission);
                return MapToDto(mission);
            }

            // Active = notes-only
            if (isActive)
            {
                if (!string.IsNullOrWhiteSpace(dto.Name)
                    || !string.IsNullOrWhiteSpace(dto.Terrain)
                    || !string.IsNullOrWhiteSpace(dto.Difficulty))
                {
                    throw new ArgumentException("Active missions allow notes-only updates.");
                }

                await _missionRepository.UpdateAsync(mission);
                return MapToDto(mission);
            }

            // Prepared / Planned / Cancelled = core edits allowed
            if (!canEditCore)
                throw new ArgumentException($"Mission with status '{mission.Status}' cannot be updated.");

            if (!string.IsNullOrWhiteSpace(dto.Terrain) && !AllowedTerrains.Contains(dto.Terrain))
                throw new ArgumentException("Invalid terrain.");

            if (!string.IsNullOrWhiteSpace(dto.Difficulty) && !AllowedDifficulties.Contains(dto.Difficulty))
                throw new ArgumentException("Invalid difficulty.");

            if (!string.IsNullOrWhiteSpace(dto.Name))
                mission.Name = dto.Name.Trim();

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

            var squad = await _squadRepository.GetByIdAsync(mission.SquadId ?? 0);
            if (squad == null)
                throw new ArgumentException("Assigned squad not found.");

            var score = await CalculateMissionScoreAsync(mission);

            var baseScore = score.BaseScore;
            var modifierScore = score.DifficultyModifier;
            var equipmentScore = score.EquipmentScore;
            var finalScore = score.FinalScore;
            var successChance = score.ProjectedSuccessChance;

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


        //MISSION READINESS
        private static List<string> GetRecommendedCategories(string terrain)
        {
            return terrain switch
            {
                "Urban" => new List<string> { "Utility", "Primary" },
                "Plains" => new List<string> { "Primary" },
                "Forest" => new List<string> { "Utility", "Melee" },
                "Mountain" => new List<string> { "Utility" },
                _ => new List<string>()
            };
        }

        private static string GetReadinessLabel(int projectedSuccessChance)
        {
            if (projectedSuccessChance >= 80) return "Excellent";
            if (projectedSuccessChance >= 65) return "Strong";
            if (projectedSuccessChance >= 50) return "Moderate";
            if (projectedSuccessChance >= 35) return "Weak";
            return "Critical";
        }

        private async Task<(int BaseScore, int DifficultyModifier, int EquipmentScore, int FinalScore, int ProjectedSuccessChance)>
            CalculateMissionScoreAsync(Mission mission)
        {
            if (mission.SquadId == null)
                throw new ArgumentException("Mission must have an assigned squad.");

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
            double rawEquipmentScore = 0;

            foreach (var se in squadEquipment)
            {
                var effectiveness = se.Equipment.Effectiveness;
                var quantity = se.Quantity;
                var multiplier = GetTerrainMultiplier(mission.Terrain, se.Equipment.Category);

                rawEquipmentScore += effectiveness * quantity * multiplier;
            }

            var equipmentScore = (int)Math.Min(30, Math.Round(rawEquipmentScore / 20.0));

            var finalScore = baseScore + difficultyModifier + equipmentScore;

            if (finalScore < 0) finalScore = 0;
            if (finalScore > 95) finalScore = 95;

            return (baseScore, difficultyModifier, equipmentScore, finalScore, finalScore);
        }

        public async Task<MissionReadinessResponseDto?> GetReadinessAsync(int missionId)
        {
            var mission = await _missionRepository.GetByIdAsync(missionId);
            if (mission == null)
                return null;

            if (string.IsNullOrWhiteSpace(mission.CommanderId))
                throw new ArgumentException("Mission must have a commander before readiness can be evaluated.");

            if (mission.SquadId == null)
                throw new ArgumentException("Mission must have an assigned squad before readiness can be evaluated.");

            if (string.IsNullOrWhiteSpace(mission.Terrain) || !AllowedTerrains.Contains(mission.Terrain))
                throw new ArgumentException("Mission terrain is missing or invalid.");

            if (string.IsNullOrWhiteSpace(mission.Difficulty) || !AllowedDifficulties.Contains(mission.Difficulty))
                throw new ArgumentException("Mission difficulty is missing or invalid.");

            var score = await CalculateMissionScoreAsync(mission);

            return new MissionReadinessResponseDto
            {
                MissionId = mission.Id,
                MissionName = mission.Name,
                Status = mission.Status,
                CommanderId = mission.CommanderId,
                SquadId = mission.SquadId,
                Terrain = mission.Terrain,
                Difficulty = mission.Difficulty,
                BaseScore = score.BaseScore,
                DifficultyModifier = score.DifficultyModifier,
                EquipmentScore = score.EquipmentScore,
                FinalScore = score.FinalScore,
                ProjectedSuccessChance = score.ProjectedSuccessChance,
                RecommendedCategories = GetRecommendedCategories(mission.Terrain),
                ReadinessLabel = GetReadinessLabel(score.ProjectedSuccessChance)
            };
        }
    }
}