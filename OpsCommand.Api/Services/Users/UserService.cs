using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using OpsCommand.Api.Domain.Entities;
using OpsCommand.Api.Infrastructure.Data;
using OpsCommand.Api.Models.Users;
using OpsCommand.Api.Repositories.Users;
using OpsCommand.Api.Repositories.Squads;

namespace OpsCommand.Api.Services.Users
{
    public class UserService : IUserService
    {
        private readonly IUserRepository _userRepository;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly ISquadRepository _squadRepository;
        private readonly ApplicationDbContext _context;

        public UserService(
            IUserRepository userRepository,
            UserManager<ApplicationUser> userManager,
            ISquadRepository squadRepository,
            ApplicationDbContext context)
        {
            _userRepository = userRepository;
            _userManager = userManager;
            _squadRepository = squadRepository;
            _context = context;
        }

        private async Task<bool> GetIsActiveAsync(ApplicationUser user)
        {
            return !await _userManager.IsLockedOutAsync(user);
        }


        private async Task SyncCommanderStateAsync(ApplicationUser user, string targetRole, int? targetSquadId)
        {
            var allCommandedSquads = await _squadRepository.GetAllActiveSquadsByCommanderIdAsync(user.Id);

            if (targetRole != "Commander")
            {
                foreach (var commandedSquad in allCommandedSquads)
                {
                    commandedSquad.CommanderId = null;
                    await _squadRepository.UpdateAsync(commandedSquad);
                }

                return;
            }

            if (targetSquadId == null)
                throw new ArgumentException("Commander must be assigned to a squad.");

            var targetSquad = await _squadRepository.GetByIdAsync(targetSquadId.Value);
            if (targetSquad == null)
                throw new ArgumentException("Assigned squad not found.");

            if (!string.IsNullOrWhiteSpace(targetSquad.CommanderId) && targetSquad.CommanderId != user.Id)
                throw new ArgumentException("Target squad already has a different commander.");

            foreach (var commandedSquad in allCommandedSquads)
            {
                if (commandedSquad.Id != targetSquad.Id)
                {
                    commandedSquad.CommanderId = null;
                    await _squadRepository.UpdateAsync(commandedSquad);
                }
            }

            if (targetSquad.CommanderId != user.Id)
            {
                targetSquad.CommanderId = user.Id;
                await _squadRepository.UpdateAsync(targetSquad);
            }
        }

        private async Task CleanupOldSquadMembershipAsync(ApplicationUser user, int? oldAssignedSquadId, int? newAssignedSquadId)
        {
            if (oldAssignedSquadId == null || oldAssignedSquadId == newAssignedSquadId)
                return;

            var allCommandedSquads = await _squadRepository.GetAllActiveSquadsByCommanderIdAsync(user.Id);

            foreach (var commandedSquad in allCommandedSquads)
            {
                if (commandedSquad.Id == oldAssignedSquadId && commandedSquad.Id != newAssignedSquadId)
                {
                    commandedSquad.CommanderId = null;
                    await _squadRepository.UpdateAsync(commandedSquad);
                }
            }
        }



        public async Task<IEnumerable<UserResponseDto>> GetAllAsync()
        {
            var users = await _userRepository.GetAllAsync();

            var result = new List<UserResponseDto>();

            foreach (var user in users)
            {
                var roles = await _userManager.GetRolesAsync(user);

                result.Add(new UserResponseDto
                {
                    Id = user.Id,
                    Email = user.Email ?? string.Empty,
                    UserName = user.UserName,
                    AssignedSquadId = user.AssignedSquadId,
                    Roles = roles,
                    IsActive = await GetIsActiveAsync(user),
                    ProfileImageUrl = user.ProfileImageUrl
                });
            }

            return result;
        }

        public async Task<UserResponseDto?> GetByIdAsync(string id)
        {
            var user = await _userRepository.GetByIdAsync(id);

            if (user == null) return null;

            var roles = await _userManager.GetRolesAsync(user);

            return new UserResponseDto
            {
                Id = user.Id,
                Email = user.Email ?? string.Empty,
                UserName = user.UserName,
                AssignedSquadId = user.AssignedSquadId,
                Roles = roles,
                IsActive = await GetIsActiveAsync(user),
                ProfileImageUrl = user.ProfileImageUrl
            };
        }

        public async Task<UserResponseDto?> AdminUpdateUserAsync(string userId, AdminUpdateUserDto dto)
        {
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null) return null;

            var allowedRoles = new[] { "Recruit", "Member", "Commander", "Admin", "SuperAdmin" };
            if (!allowedRoles.Contains(dto.Role))
                throw new ArgumentException("Invalid role.");

            var currentRoles = await _userManager.GetRolesAsync(user);
            var currentPrimaryRole = currentRoles.FirstOrDefault() ?? "Recruit";

            var targetRole = dto.Role;
            var oldAssignedSquadId = user.AssignedSquadId;
            var newAssignedSquadId = dto.AssignedSquadId;

            if (newAssignedSquadId != null &&
                currentPrimaryRole == "Recruit" &&
                dto.Role == "Recruit")
            {
                targetRole = "Member";
            }

            if (targetRole == "Member" && newAssignedSquadId == null && currentPrimaryRole == "Recruit")
                throw new ArgumentException("Member must be assigned to a squad.");

            if (targetRole == "Commander" && newAssignedSquadId == null)
                throw new ArgumentException("Commander must be assigned to a squad.");

            // role update
            var removeRes = await _userManager.RemoveFromRolesAsync(user, currentRoles);
            if (!removeRes.Succeeded)
                throw new ArgumentException(string.Join("; ", removeRes.Errors.Select(e => e.Description)));

            var addRes = await _userManager.AddToRoleAsync(user, targetRole);
            if (!addRes.Succeeded)
                throw new ArgumentException(string.Join("; ", addRes.Errors.Select(e => e.Description)));

            // squad membership na useru
            user.AssignedSquadId = newAssignedSquadId;

            var updateRes = await _userManager.UpdateAsync(user);
            if (!updateRes.Succeeded)
                throw new ArgumentException(string.Join("; ", updateRes.Errors.Select(e => e.Description)));

            // sinkronizacija Squad.CommanderId <-> User.AssignedSquadId
            await CleanupOldSquadMembershipAsync(user, oldAssignedSquadId, newAssignedSquadId);
            await SyncCommanderStateAsync(user, targetRole, newAssignedSquadId);

            var roles = await _userManager.GetRolesAsync(user);

            return new UserResponseDto
            {
                Id = user.Id,
                Email = user.Email ?? string.Empty,
                UserName = user.UserName,
                AssignedSquadId = user.AssignedSquadId,
                Roles = roles,
                IsActive = await GetIsActiveAsync(user),
                ProfileImageUrl = user.ProfileImageUrl
            };
        }

        private async Task<UserProfileEquipmentSummaryDto> BuildEquipmentSummaryAsync(string userId)
        {
            var items = await _context.UserEquipments
                .Include(ue => ue.Equipment)
                .Where(ue => ue.UserId == userId)
                .Where(ue => ue.Equipment.DeletedAt == null)
                .ToListAsync();

            var summary = new UserProfileEquipmentSummaryDto();

            foreach (var item in items)
            {
                var label = $"{item.Equipment.Name} x{item.Quantity}";

                switch (item.Equipment.Category)
                {
                    case "Primary":
                        summary.Primary.Add(label);
                        break;

                    case "Secondary":
                        summary.Secondary.Add(label);
                        break;

                    case "Melee":
                        summary.Melee.Add(label);
                        break;

                    case "Utility":
                        summary.Utility.Add(label);
                        break;
                }
            }

            return summary;
        }

        public async Task<UserProfileResponseDto?> GetProfileByIdAsync(string targetUserId, string callerUserId, bool isAdmin)
        {
            var targetUser = await _userManager.FindByIdAsync(targetUserId);
            if (targetUser == null)
                return null;

            var callerUser = await _userManager.FindByIdAsync(callerUserId);
            if (callerUser == null)
                return null;

            if (!isAdmin)
            {
                var callerRoles = await _userManager.GetRolesAsync(callerUser);
                var callerIsMemberOrCommander = callerRoles.Contains("Member") || callerRoles.Contains("Commander");

                if (!callerIsMemberOrCommander)
                    throw new UnauthorizedAccessException("You are not allowed to view this profile.");

                if (callerUser.AssignedSquadId == null || targetUser.AssignedSquadId == null)
                    throw new UnauthorizedAccessException("You are not allowed to view this profile.");

                if (callerUser.AssignedSquadId != targetUser.AssignedSquadId)
                    throw new UnauthorizedAccessException("You can only view profiles of users in your own squad.");
            }

            var roles = await _userManager.GetRolesAsync(targetUser);
            string? primaryRole = roles.FirstOrDefault();

            var equipmentSummary = await BuildEquipmentSummaryAsync(targetUser.Id);

            return new UserProfileResponseDto
            {
                Id = targetUser.Id,
                Email = targetUser.Email ?? string.Empty,
                UserName = targetUser.UserName,
                AssignedSquadId = targetUser.AssignedSquadId,
                PrimaryRole = primaryRole,
                IsActive = await GetIsActiveAsync(targetUser),
                ProfileImageUrl = targetUser.ProfileImageUrl,
                EquipmentSummary = equipmentSummary
            };
        }

        public async Task<UserResponseDto?> UpdateMeAsync(string userId, UpdateMeDto dto)
        {
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
                return null;

            if (!string.IsNullOrWhiteSpace(dto.UserName))
            {
                await _userManager.SetUserNameAsync(user, dto.UserName);
            }

            if (!string.IsNullOrWhiteSpace(dto.Email))
            {
                await _userManager.SetEmailAsync(user, dto.Email);
            }

            var result = await _userManager.UpdateAsync(user);
            if (!result.Succeeded)
            {
                return null;
            }

            var roles = await _userManager.GetRolesAsync(user);

            return new UserResponseDto
            {
                Id = user.Id,
                UserName = user.UserName,
                Email = user.Email ?? string.Empty,
                Roles = roles,
                AssignedSquadId = user.AssignedSquadId,
                IsActive = await GetIsActiveAsync(user),
                ProfileImageUrl = user.ProfileImageUrl
            };
        }

        public async Task<bool> ChangeMyPasswordAsync(string userId, ChangePasswordDto dto)
        {
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
            {
                return false;
            }

            if (await _userManager.IsLockedOutAsync(user))
            {
                return false;
            }

            var result = await _userManager.ChangePasswordAsync(user, dto.CurrentPassword, dto.NewPassword);

            return result.Succeeded;
        }

        public async Task<IEnumerable<UserResponseDto>> GetPendingAsync()
        {
            var pendingUsers = await _userManager.Users
                .Where(u => u.LockoutEnabled && u.LockoutEnd != null && u.LockoutEnd > DateTimeOffset.UtcNow)
                .ToListAsync();

            var result = new List<UserResponseDto>();

            foreach (var user in pendingUsers)
            {
                var roles = await _userManager.GetRolesAsync(user);

                result.Add(new UserResponseDto
                {
                    Id = user.Id,
                    Email = user.Email ?? string.Empty,
                    UserName = user.UserName,
                    AssignedSquadId = user.AssignedSquadId,
                    Roles = roles,
                    IsActive = await GetIsActiveAsync(user),
                    ProfileImageUrl = user.ProfileImageUrl
                });
            }

            return result;
        }

        public async Task<bool> ApproveUserAsync(string id)
        {
            var user = await _userManager.FindByIdAsync(id);
            if (user == null)
                return false;

            await _userManager.SetLockoutEndDateAsync(user, null);
            await _userManager.SetLockoutEnabledAsync(user, false);

            return true;
        }

        public async Task<bool> DisableUserAsync(string id)
        {
            var user = await _userManager.FindByIdAsync(id);
            if (user == null)
                return false;

            await _userManager.SetLockoutEnabledAsync(user, true);
            await _userManager.SetLockoutEndDateAsync(user, DateTimeOffset.MaxValue);
            return true;
        }

        public async Task<bool> RestoreAsync(string id)
        {
            var user = await _userManager.FindByIdAsync(id);
            if (user == null)
                return false;

            await _userManager.SetLockoutEndDateAsync(user, null);
            await _userManager.SetLockoutEnabledAsync(user, false);
            return true;
        }
    }
}