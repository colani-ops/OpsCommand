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
        
        public UserService(IUserRepository userRepository, UserManager<ApplicationUser> userManager) {
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



    }
}
