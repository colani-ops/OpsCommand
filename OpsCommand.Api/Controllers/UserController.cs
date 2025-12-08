using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OpsCommand.Api.Services.Users;

namespace OpsCommand.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin, SuperAdmin")]
    public class UserController : ControllerBase
    {

        private readonly IUserService _userService;

        public UserController(IUserService userService)
        {
            _userService = userService;
        }

        //GET: /api/users
        [HttpGet]
        public async Task<IActionResult> GetAll() {
            var users = await _userService.GetAllAsync();

            return Ok(users);
        }


        //GET /api/users/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById (string id)
        {
            var user = await _userService.GetByIdAsync(id);

            if (user == null)
               return NotFound();

         return Ok(user);
        }

        //CREATE /api/users/new

        //EDIT /api/users/edit


        //DELETE /api/users/{id}
        [HttpDelete("{id}")]
        public async void DeleteById(string id) 
        {

        }
                

    }
}
