using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

using Microsoft.AspNetCore.Identity;
using OpsCommand.Api.Domain.Entities;
using OpsCommand.Api.Models.Users;
using OpsCommand.Api.Repositories.Users;

namespace OpsCommand.Api.Services.Users
{
    public class UserService : IUserService
    {
        private readonly IUserRepository _userRepository;
        private readonly UserManager<ApplicationUser> _userManager;

        public UserService(IUserRepository userRepository, UserManager<ApplicationUser> userManager)
        {
            _userRepository = userRepository;
            _userManager = userManager;
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
                    //IsActive = user.IsActive
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
                Roles = roles
            };
        }



        public async Task<UserResponseDto?> AdminUpdateUserAsync(string userId, AdminUpdateUserDto dto)
        {
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null) return null;

            //Role change (provjeri rezultate)
            var currentRoles = await _userManager.GetRolesAsync(user);

            var removeRes = await _userManager.RemoveFromRolesAsync(user, currentRoles);
            if (!removeRes.Succeeded)
                throw new ArgumentException(string.Join("; ", removeRes.Errors.Select(e => e.Description)));

            var addRes = await _userManager.AddToRoleAsync(user, dto.Role);
            if (!addRes.Succeeded)
                throw new ArgumentException(string.Join("; ", addRes.Errors.Select(e => e.Description)));

            //Squad change (promjena na user entity)
            user.AssignedSquadId = dto.AssignedSquadId;

            //spremi user u bazu
            var updateRes = await _userManager.UpdateAsync(user);
            if (!updateRes.Succeeded)
                throw new ArgumentException(string.Join("; ", updateRes.Errors.Select(e => e.Description)));

            var roles = await _userManager.GetRolesAsync(user);

            return new UserResponseDto
            {
                Id = user.Id,
                Email = user.Email ?? string.Empty,
                UserName = user.UserName,
                AssignedSquadId = user.AssignedSquadId,
                Roles = roles
            };
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



        public async Task<UserResponseDto?> UpdateMeAsync (string userId, UpdateMeDto dto) {

            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
                return null;

            //Apply changes
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
                return null; //Kasnije možda error?
            }

            var roles = await _userManager.GetRolesAsync(user);

            return new UserResponseDto
            {
                Id = user.Id,
                UserName = user.UserName,
                Email = user.Email,
                Roles = roles,
                AssignedSquadId = user.AssignedSquadId
            };
        }

        public async Task<bool> ChangeMyPasswordAsync(string userId, ChangePasswordDto dto)
        {
            var user = await _userManager.FindByIdAsync(userId);
            if(user == null)
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
    }
}
