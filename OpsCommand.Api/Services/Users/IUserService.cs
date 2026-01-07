using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

using OpsCommand.Api.Models.Users;

namespace OpsCommand.Api.Services.Users
{
    public interface IUserService
    {
        Task<IEnumerable<UserResponseDto>> GetAllAsync();
        Task<UserResponseDto?> GetByIdAsync(string id);
        Task<UserResponseDto?> AdminUpdateUserAsync(string userId, AdminUpdateUserDto dto);

        Task<bool> DisableUserAsync(string id);
        Task<bool> RestoreAsync(string id);
    }
}
