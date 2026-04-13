using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Security.Claims;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OpsCommand.Api.Models.Users;
using OpsCommand.Api.Services.Users;

using Microsoft.AspNetCore.Identity;
using OpsCommand.Api.Domain.Entities;

namespace OpsCommand.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UserController : ControllerBase
    {

        private readonly IUserService _userService;

        private readonly UserManager<ApplicationUser> _userManager;

        public UserController(IUserService userService, UserManager<ApplicationUser> userManager)
        {
            _userService = userService;
            _userManager = userManager;
        }


        //GET: /api/user
        [HttpGet]
        [Authorize(Roles = "SuperAdmin,Admin")]
        public async Task<IActionResult> GetAll() {
            var users = await _userService.GetAllAsync();

            return Ok(users);
        }


        //GET /api/user/{id}
        [HttpGet("{id}")]
        [Authorize(Roles ="SuperAdmin,Admin")]
        public async Task<IActionResult> GetById (string id)
        {
            var user = await _userService.GetByIdAsync(id);

            if (user == null)
               return NotFound();

         return Ok(user);
        }

        //CREATE /api/user/new

        //PUT /api/user/{id}/admin
        [HttpPut("{id}/admin")]
        [Authorize(Roles = "SuperAdmin,Admin")]
        public async Task<IActionResult> AdminUpdateUser(string id, [FromBody] AdminUpdateUserDto dto)
        {
            var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrWhiteSpace(currentUserId))
                return Unauthorized();

            var callerIsSuperAdmin = User.IsInRole("SuperAdmin");

            var target = await _userManager.FindByIdAsync(id);
            if (target == null)
                return NotFound();

            var targetIsSuperAdmin = await _userManager.IsInRoleAsync(target, "SuperAdmin");

            // Nobody updates their own role/squad through admin endpoint
            if (currentUserId == id)
            {
                return StatusCode(StatusCodes.Status403Forbidden,
                    new { message = "You cannot modify your own account through this endpoint." });
            }

            // Admin cannot modify SuperAdmin account
            if (!callerIsSuperAdmin && targetIsSuperAdmin)
            {
                return StatusCode(StatusCodes.Status403Forbidden,
                    new { message = "Admin cannot modify a SuperAdmin account." });
            }

            // Admin cannot assign SuperAdmin role
            if (!callerIsSuperAdmin && dto.Role == "SuperAdmin")
            {
                return StatusCode(StatusCodes.Status403Forbidden,
                    new { message = "Admin cannot assign the SuperAdmin role." });
            }

            try
            {
                var updatedUser = await _userService.AdminUpdateUserAsync(id, dto);

                if (updatedUser == null)
                    return NotFound();

                return Ok(updatedUser);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }


        //DELETE /api/user/{id}
        [HttpDelete("{id}")]
        [Authorize(Roles = "SuperAdmin")]
        public async Task<IActionResult> DeleteById(string id) 
        {

            var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (currentUserId == id)
            {
                return BadRequest("You cannot disable your own account.");
            }

            var callerIsSuperAdmin = User.IsInRole("SuperAdmin");

            var target = await _userManager.FindByIdAsync(id);
            if (target == null)
                return NotFound();

            var targetIsSuperAdmin = await _userManager.IsInRoleAsync(target, "SuperAdmin");


            if (targetIsSuperAdmin && !callerIsSuperAdmin)
            {
                return Forbid("You cannot disable an administrator");
            }

            var done = await _userService.DisableUserAsync(id);
            if (!done) return NotFound();
            return NoContent();
        }

        //POST /api/user/{id}/restore
        [HttpPost("{id}/restore")]
        [Authorize(Roles = "SuperAdmin")]
        public async Task<IActionResult> RestoreById(string id)
        {
            var done = await _userService.RestoreAsync(id);
            if (!done) return NotFound();
            return NoContent();
        }



        //GET /api/user/me
        [HttpGet("me")]
        [Authorize]
        public async Task<IActionResult> GetMe()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized();
            }

            var user = await _userService.GetByIdAsync(userId);

            if (user == null)
            {
                return NotFound();
            }

            return Ok(user);
        }



        //GET /api/{id}/profile
        [HttpGet("{id}/profile")]
        [Authorize(Roles = "Member,Commander,Admin,SuperAdmin")]
        public async Task<IActionResult> GetProfile(string id)
        {
            var callerUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrWhiteSpace(callerUserId))
                return Unauthorized();

            var isAdmin = User.IsInRole("Admin") || User.IsInRole("SuperAdmin");

            var profile = await _userService.GetProfileByIdAsync(id, callerUserId, isAdmin);

            if (profile == null)
                return NotFound();

            return Ok(profile);
        }



        //PUT /api/user/me
        [HttpPut("me")]
        [Authorize]
        public async Task<IActionResult> UpdateMe([FromBody] UpdateMeDto dto)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var updatedUser = await _userService.UpdateMeAsync(userId, dto);

            if (updatedUser == null)
                return NotFound();

            return Ok(updatedUser);
        }

        //PUT /api/user/me/password
        [HttpPut("me/password")]
        [Authorize]
        public async Task<IActionResult> ChangeMyPassword([FromBody] ChangePasswordDto dto)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized();
            }

            var ok = await _userService.ChangeMyPasswordAsync(userId, dto);
            if (!ok)
            {
                return BadRequest(new { message = "Password change failed. Check current password or password rules." });
            }
            return NoContent();
        }



        [HttpGet("pending")]
        [Authorize(Roles = "SuperAdmin")]
        public async Task<IActionResult> GetPending()
        {
            var users = await _userService.GetPendingAsync();
            return Ok(users);
        }



        [HttpPost("{id}/approve")]
        [Authorize(Roles = "SuperAdmin")]
        public async Task<IActionResult> ApproveUser(string id)
        {
            var done = await _userService.ApproveUserAsync(id);
            if (!done) return NotFound();
            return NoContent();
        }
    }
}
