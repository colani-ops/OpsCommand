using Microsoft.AspNetCore.Identity;
using OpsCommand.Api.Domain.Entities;
using OpsCommand.Api.Models.Missions;
using OpsCommand.Api.Repositories.Missions;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace OpsCommand.Api.Services.Missions
{
    public class MissionService : IMissionService
    {
        private readonly IMissionRepository _missionRepository;
        private readonly UserManager<ApplicationUser> _userManager;

        public MissionService(IMissionRepository missionRepository, UserManager<ApplicationUser> userManager)
        {
            _missionRepository = missionRepository;
            _userManager = userManager;
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
                SquadId = mission.SquadId
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
            if (!string.IsNullOrWhiteSpace(dto.CommanderId))
            {
                var commander = await _userManager.FindByIdAsync(dto.CommanderId);
                if (commander == null)
                {
                    throw new ArgumentException("Commander user not found.");
                }

                if (await _userManager.IsLockedOutAsync(commander))
                {
                    throw new ArgumentException("Commander is inactive");
                }

                var isCommander = await _userManager.IsInRoleAsync(commander, "Commander");

                if (!isCommander)
                {
                    throw new ArgumentException("User is not eligible to be a commander");
                }
            }

            var hasCommander = !string.IsNullOrWhiteSpace(dto.CommanderId);

            var mission = new Mission
            {
                Name = dto.Name,
                Status = hasCommander ? "Planned" : "Prepared",
                CommanderId = hasCommander ? dto.CommanderId : null,
                CreatedAt = DateTime.UtcNow,
                CreatedByUserId = createdByUserId,
                Notes = dto.Notes
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

            var isTerminal = mission.Status is "Completed" or "Cancelled";

            // notes uvijek smije
            if (dto.Notes != null)
                mission.Notes = dto.Notes;

            // Ako je terminal, ne diraj ništa drugo
            if (isTerminal)
            {
                // ako user pokušava mijenjati Name/Status, javi  poruku
                if (!string.IsNullOrWhiteSpace(dto.Name) || dto.Status != null)
                    throw new ArgumentException($"Can't edit mission fields when status is '{mission.Status}'. Only Notes can be updated.");

                await _missionRepository.UpdateAsync(mission);
                return MapToDto(mission);
            }

            // normal edits
            if (!string.IsNullOrWhiteSpace(dto.Name))
                mission.Name = dto.Name;

            if (dto.Status != null)
            {
                if (!AllowedStates.Contains(dto.Status))
                    throw new ArgumentException("Invalid mission status.");

                if (dto.Status == "Active" && string.IsNullOrWhiteSpace(mission.CommanderId))
                    throw new ArgumentException("Cannot activate mission without a commander.");

                mission.Status = dto.Status;
            }

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

            // Prepared -> Planned, Cancelled -> Planned (reactivation path)
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
    }
}