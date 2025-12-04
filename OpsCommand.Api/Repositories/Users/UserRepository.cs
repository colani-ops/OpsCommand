using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

using Microsoft.AspNetCore.Identity;
using OpsCommand.Api.Domain.Entities;

namespace OpsCommand.Api.Repositories.Users


{
    public class UserRepository : IUserRepository
    {
        private readonly UserManager<ApplicationUser> _userManager;
    
        public UserRepository(UserManager<ApplicationUser> userManager)
        {
            _userManager = userManager;
        }

        public async Task<IEnumerable<ApplicationUser>> GetAllAsync()
        {
            //UserManager.Users je IQuerayble<ApplicationUser>
            //ToListAsync je dovoljan za sada
            return await Task.FromResult(_userManager.Users.ToList());
        }

        public async Task<ApplicationUser?> GetByIdAsync(string id)
        {
            return await _userManager.FindByIdAsync(id);
        }

    }
}
