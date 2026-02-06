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



        public async Task <List<MissionResponseDto>> GetAllAsync()
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

                if(await _userManager.IsLockedOutAsync(commander))
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
            // Commander promjene su zabranjene ovdje
            if (!string.IsNullOrWhiteSpace(dto.CommanderId) || dto.ClearCommander)
                throw new ArgumentException("Use /commander endpoint to assign/unassign commander.");

            var mission = await _missionRepository.GetByIdAsync(id);
            if (mission == null) return null;

            if (!string.IsNullOrWhiteSpace(dto.Name))
                mission.Name = dto.Name;

            if (dto.Notes != null)
                mission.Notes = dto.Notes;

            if (dto.Status != null)
            {
                if (!AllowedStates.Contains(dto.Status))
                    throw new ArgumentException("Invalid mission status.");

                if (mission.Status is "Completed" or "Cancelled")
                    throw new ArgumentException("Cannot modify a completed/cancelled mission.");

                if (dto.Status == "Active" && string.IsNullOrWhiteSpace(mission.CommanderId))
                    throw new ArgumentException("Cannot activate mission without a commander.");

                mission.Status = dto.Status;
            }

            await _missionRepository.UpdateAsync(mission);
            return MapToDto(mission);
        }



        public async Task<bool>DeleteAsync(int id)
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
            if (mission.Status == "Completed" || mission.Status == "Cancelled")
                throw new ArgumentException("Cannot assign commander to a completed/cancelled mission.");

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

            //status transition (Prepared -> Planned)
            if (mission.Status == "Prepared")
                mission.Status = "Planned";

            await _missionRepository.UpdateAsync(mission);

            return MapToDto(mission);
        }



        public async Task<MissionResponseDto?> UnassignCommanderAsync(int missionId)
        {
            var mission = await _missionRepository.GetByIdAsync(missionId);
            if (mission == null) return null;

            // guardrails
            if (mission.Status == "Completed" || mission.Status == "Cancelled")
                throw new ArgumentException("Cannot modify a completed/cancelled mission.");

            if (mission.Status == "Active")
                throw new ArgumentException("Cannot unassign commander while mission is Active.");

            mission.CommanderId = null;
            mission.SquadId = null;
            mission.Status = "Prepared"; // vraćamo u pool

            await _missionRepository.UpdateAsync(mission);
            return MapToDto(mission);
        }
    }
}
