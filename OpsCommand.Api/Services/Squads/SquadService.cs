using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using OpsCommand.Api.Domain.Entities;
using OpsCommand.Api.Models.Squads;
using OpsCommand.Api.Repositories.Missions;
using OpsCommand.Api.Repositories.Squads;
using OpsCommand.Api.Repositories.SquadEquipments;
using OpsCommand.Api.Models.SquadEquipment;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace OpsCommand.Api.Services.Squads
{
    public class SquadService : ISquadService
    {
        private readonly ISquadRepository _squadRepository;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly IMissionRepository _missionRepository;
        private readonly ISquadEquipmentRepository _squadEquipmentRepository;

        public SquadService(
            ISquadRepository squadRepository,
            UserManager<ApplicationUser> userManager,
            IMissionRepository missionRepository,
            ISquadEquipmentRepository squadEquipmentRepository)
        {
            _squadRepository = squadRepository;
            _userManager = userManager;
            _missionRepository = missionRepository;
            _squadEquipmentRepository = squadEquipmentRepository;
        }

        private static readonly string[] AllowedTypes =
        [
            "Assault",
            "Tactical",
            "Recon"
        ];

        public async Task<IEnumerable<SquadResponseDto>> GetAllAsync()
        {
            var squads = await _squadRepository.GetAllAsync();

            var result = new List<SquadResponseDto>();

            foreach (var squad in squads)
            {
                result.Add(new SquadResponseDto
                {
                    Id = squad.Id,
                    Name = squad.Name,
                    Type = squad.Type,
                    CommanderId = squad.CommanderId,
                    CreatedAt = squad.CreatedAt,
                    DeletedAt = squad.DeletedAt,
                    MissionsServed = squad.MissionsServed,
                    MissionsWon = squad.MissionsWon
                });
            }

            return result;
        }

        public async Task<SquadResponseDto?> GetByIdAsync(int id)
        {
            var squad = await _squadRepository.GetByIdAsync(id);

            if (squad == null)
            {
                return null;
            }

            return new SquadResponseDto
            {
                Id = squad.Id,
                Name = squad.Name,
                Type = squad.Type,
                CommanderId = squad.CommanderId,
                CreatedAt = squad.CreatedAt,
                DeletedAt = squad.DeletedAt,
                MissionsServed = squad.MissionsServed,
                MissionsWon = squad.MissionsWon
            };
        }

        public async Task<SquadProfileResponseDto?> GetProfileByIdAsync(int id)
        {
            var squad = await _squadRepository.GetByIdAsync(id);
            if (squad == null)
                return null;

            string? commanderName = null;

            if (!string.IsNullOrWhiteSpace(squad.CommanderId))
            {
                var commander = await _userManager.FindByIdAsync(squad.CommanderId);
                if (commander != null)
                {
                    commanderName = $"{commander.UserName} ({commander.Email})";
                }
            }

            var equipment = await _squadEquipmentRepository.GetBySquadIdAsync(id);

            var equipmentDtos = equipment.Select(se => new SquadEquipmentResponseDto
            {
                SquadId = se.SquadId,
                EquipmentId = se.EquipmentId,
                EquipmentName = se.Equipment.Name,
                Category = se.Equipment.Category,
                Quantity = se.Quantity
            }).ToList();

            var squadUsers = await _userManager.Users
                .Where(u => u.AssignedSquadId == id)
                .ToListAsync();

            var memberDtos = new List<SquadMemberDto>();

            foreach (var user in squadUsers)
            {
                var roles = await _userManager.GetRolesAsync(user);
                var primaryRole = roles.FirstOrDefault() ?? "Unknown";

                memberDtos.Add(new SquadMemberDto
                {
                    Id = user.Id,
                    Email = user.Email ?? string.Empty,
                    UserName = user.UserName,
                    Role = primaryRole,
                    IsActive = !await _userManager.IsLockedOutAsync(user),
                    ProfileImageUrl = user.ProfileImageUrl
                });
            }

            var successRate = squad.MissionsServed > 0
                ? Math.Round((double)squad.MissionsWon / squad.MissionsServed * 100, 2)
                : 0;

            return new SquadProfileResponseDto
            {
                Id = squad.Id,
                Name = squad.Name,
                Type = squad.Type,
                CommanderId = squad.CommanderId,
                CommanderName = commanderName,
                IsActive = squad.DeletedAt == null,
                CreatedAt = squad.CreatedAt,
                DeletedAt = squad.DeletedAt,
                MissionsServed = squad.MissionsServed,
                MissionsWon = squad.MissionsWon,
                SuccessRate = successRate,
                BannerImageUrl = squad.BannerImageUrl,
                Equipment = equipmentDtos,
                Members = memberDtos
            };
        }

        public async Task<MySquadResponseDto?> GetMySquadAsync(string userId)
        {
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
                return null;

            if (user.AssignedSquadId == null)
                return null;

            var squad = await _squadRepository.GetByIdAsync(user.AssignedSquadId.Value);
            if (squad == null)
                return null;

            var squadUsers = await _userManager.Users
                .Where(u => u.AssignedSquadId == squad.Id)
                .ToListAsync();

            var memberDtos = new List<SquadMemberDto>();

            foreach (var memberUser in squadUsers)
            {
                var roles = await _userManager.GetRolesAsync(memberUser);
                var primaryRole = roles.FirstOrDefault() ?? "Unknown";

                memberDtos.Add(new SquadMemberDto
                {
                    Id = memberUser.Id,
                    Email = memberUser.Email ?? string.Empty,
                    UserName = memberUser.UserName,
                    Role = primaryRole,
                    IsActive = !await _userManager.IsLockedOutAsync(memberUser),
                    ProfileImageUrl = memberUser.ProfileImageUrl
                });
            }

            memberDtos = memberDtos
                .GroupBy(m => m.Id)
                .Select(g => g.First())
                .ToList();

            string? commanderName = null;

            if (!string.IsNullOrWhiteSpace(squad.CommanderId))
            {
                var commander = await _userManager.FindByIdAsync(squad.CommanderId);
                if (commander != null)
                {
                    commanderName = $"{commander.UserName} ({commander.Email})";
                }
            }

            var successRate = squad.MissionsServed > 0
                ? Math.Round((double)squad.MissionsWon / squad.MissionsServed * 100, 2)
                : 0;

            return new MySquadResponseDto
            {
                Id = squad.Id,
                Name = squad.Name,
                Type = squad.Type,
                CommanderId = squad.CommanderId,
                CommanderName = commanderName,
                MissionsServed = squad.MissionsServed,
                MissionsWon = squad.MissionsWon,
                SuccessRate = successRate,
                Members = memberDtos
            };
        }

        public async Task<SquadResponseDto> CreateAsync(SquadCreateDto dto)
        {
            if (!string.IsNullOrWhiteSpace(dto.CommanderId))
            {
                var commander = await _userManager.FindByIdAsync(dto.CommanderId);

                if (commander == null)
                    throw new ArgumentException("Commander user not found.");

                var isCommander = await _userManager.IsInRoleAsync(commander, "Commander");

                if (!isCommander)
                    throw new ArgumentException("User is not eligible to be a commander.");

                var existing = await _squadRepository.GetActiveSquadByCommanderIdAsync(dto.CommanderId);

                if (existing != null)
                    throw new ArgumentException($"Commander is already assigned to squad '{existing.Name}' (Id {existing.Id}).");

                if (await _userManager.IsLockedOutAsync(commander))
                    throw new ArgumentException("Commander is inactive");
            }

            if (!AllowedTypes.Contains(dto.Type))
            {
                throw new ArgumentException("Invalid squad type. Allowed: Assault, Tactical, Recon");
            }

            var squad = new Squad
            {
                Name = dto.Name,
                Type = dto.Type,
                CommanderId = dto.CommanderId,
                CreatedAt = DateTime.UtcNow,
                MissionsServed = 0,
                MissionsWon = 0
            };

            await _squadRepository.AddAsync(squad);

            if (!string.IsNullOrWhiteSpace(dto.CommanderId))
            {
                var commander = await _userManager.FindByIdAsync(dto.CommanderId);
                if (commander == null)
                    throw new ArgumentException("Commander user not found after squad creation.");

                commander.AssignedSquadId = squad.Id;

                var updateCommanderRes = await _userManager.UpdateAsync(commander);
                if (!updateCommanderRes.Succeeded)
                    throw new ArgumentException(string.Join("; ", updateCommanderRes.Errors.Select(e => e.Description)));
            }

            return new SquadResponseDto
            {
                Id = squad.Id,
                Name = squad.Name,
                Type = squad.Type,
                CommanderId = squad.CommanderId,
                CreatedAt = squad.CreatedAt,
                DeletedAt = squad.DeletedAt,
                MissionsServed = squad.MissionsServed,
                MissionsWon = squad.MissionsWon
            };
        }

        public async Task<SquadResponseDto?> UpdateAsync(int id, SquadUpdateDto dto)
        {
            var squad = await _squadRepository.GetByIdAsync(id);
            if (squad == null) return null;

            var oldCommanderId = squad.CommanderId;

            if (!string.IsNullOrWhiteSpace(dto.Name))
                squad.Name = dto.Name;

            if (!string.IsNullOrWhiteSpace(dto.Type))
            {
                if (!AllowedTypes.Contains(dto.Type))
                    throw new ArgumentException("Invalid squad type. Allowed: Assault, Tactical, Recon");

                squad.Type = dto.Type;
            }

            var commanderId = string.IsNullOrWhiteSpace(dto.CommanderId) ? null : dto.CommanderId;

            if (oldCommanderId != null && oldCommanderId != commanderId)
            {
                var hasOpenMissions = await _missionRepository
                    .HasOpenMissionsForCommanderInSquadAsync(oldCommanderId, squad.Id);

                if (hasOpenMissions)
                    throw new ArgumentException("Cannot change or remove squad commander while they have open missions for this squad.");
            }

            if (commanderId == null)
            {
                if (oldCommanderId != null)
                {
                    var oldCommander = await _userManager.FindByIdAsync(oldCommanderId);
                    if (oldCommander != null && oldCommander.AssignedSquadId == squad.Id)
                    {
                        oldCommander.AssignedSquadId = null;
                        var oldUpdateRes = await _userManager.UpdateAsync(oldCommander);
                        if (!oldUpdateRes.Succeeded)
                            throw new ArgumentException(string.Join("; ", oldUpdateRes.Errors.Select(e => e.Description)));
                    }
                }

                squad.CommanderId = null;
            }
            else
            {
                var commanderUser = await _userManager.FindByIdAsync(commanderId);
                if (commanderUser == null)
                    throw new ArgumentException("Commander user not found.");

                var isCommander = await _userManager.IsInRoleAsync(commanderUser, "Commander");
                if (!isCommander)
                    throw new ArgumentException("User is not eligible to be a commander.");

                if (await _userManager.IsLockedOutAsync(commanderUser))
                    throw new ArgumentException("Commander is inactive.");

                var existing = await _squadRepository.GetActiveSquadByCommanderIdAsync(commanderId, excludeSquadId: id);
                if (existing != null)
                    throw new ArgumentException($"Commander is already assigned to squad '{existing.Name}' (Id {existing.Id}).");

                squad.CommanderId = commanderId;

                if (oldCommanderId != null && oldCommanderId != commanderId)
                {
                    var oldCommander = await _userManager.FindByIdAsync(oldCommanderId);
                    if (oldCommander != null && oldCommander.AssignedSquadId == squad.Id)
                    {
                        oldCommander.AssignedSquadId = null;
                        var oldUpdateRes = await _userManager.UpdateAsync(oldCommander);
                        if (!oldUpdateRes.Succeeded)
                            throw new ArgumentException(string.Join("; ", oldUpdateRes.Errors.Select(e => e.Description)));
                    }
                }

                if (commanderUser.AssignedSquadId != squad.Id)
                {
                    commanderUser.AssignedSquadId = squad.Id;
                    var commanderUpdateRes = await _userManager.UpdateAsync(commanderUser);
                    if (!commanderUpdateRes.Succeeded)
                        throw new ArgumentException(string.Join("; ", commanderUpdateRes.Errors.Select(e => e.Description)));
                }
            }

            await _squadRepository.UpdateAsync(squad);

            return new SquadResponseDto
            {
                Id = squad.Id,
                Name = squad.Name,
                Type = squad.Type,
                CommanderId = squad.CommanderId,
                CreatedAt = squad.CreatedAt,
                DeletedAt = squad.DeletedAt,
                MissionsServed = squad.MissionsServed,
                MissionsWon = squad.MissionsWon
            };
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var squad = await _squadRepository.GetByIdAsync(id);
            if (squad == null)
                return false;

            if (!string.IsNullOrWhiteSpace(squad.CommanderId))
            {
                var hasOpenMissions = await _missionRepository.HasOpenMissionsForCommanderInSquadAsync(squad.CommanderId, squad.Id);

                if (hasOpenMissions)
                    throw new ArgumentException("Cannot delete squad while it has open missions.");

                var commander = await _userManager.FindByIdAsync(squad.CommanderId);
                if (commander != null && commander.AssignedSquadId == squad.Id)
                {
                    commander.AssignedSquadId = null;
                    var updateRes = await _userManager.UpdateAsync(commander);
                    if (!updateRes.Succeeded)
                        throw new ArgumentException(string.Join("; ", updateRes.Errors.Select(e => e.Description)));
                }
            }

            await _squadRepository.DeleteAsync(squad);
            return true;
        }
    }
}