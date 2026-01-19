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
                    Notes = mission.Notes
                };
        }



        public async Task <List<MissionResponseDto>> GetAllAsync()
        {
            var missions = await _missionRepository.GetAllAsync();

            var result = new List<MissionResponseDto>();

            foreach (var mission in missions)
            {
                result.Add(new MissionResponseDto
                {
                    Id = mission.Id,
                    Name = mission.Name,
                    Status = mission.Status,
                    CommanderId = mission.CommanderId,
                    CreatedAt = mission.CreatedAt,
                    Notes = mission.Notes
                });
            }
            return result;
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
            if (dto.CommanderId != null)
            {
                var commander = await _userManager.FindByIdAsync(dto.CommanderId);
                if (commander == null)
                {
                    throw new ArgumentException("Commanderuser not found");
                }
            }

            var mission = await _missionRepository.GetByIdAsync(id);

            if (mission == null)
            {
                return null;
            }

            if (!string.IsNullOrWhiteSpace(dto.Name))
                mission.Name = dto.Name;

            if (dto.Notes != null)
                mission.Notes = dto.Notes;

            if (dto.ClearCommander)
            {
                mission.CommanderId = null;
                mission.Status = "Prepared";
            }

            if (dto.Status != null)
            {
                if (!AllowedStates.Contains(dto.Status))
                    throw new ArgumentException("Invalid mission status...");
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
            var missions = await _missionRepository.GetAllAsync();
            return missions
                .Where(m => m.CommanderId == userId)
                .Select(MapToDto)
                .ToList();
        }
    }
}
