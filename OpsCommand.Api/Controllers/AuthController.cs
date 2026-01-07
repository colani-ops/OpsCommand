using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using OpsCommand.Api.Domain.Entities;
using OpsCommand.Api.Models.Auth;
using OpsCommand.Api.Models.Auth.OpsCommand.Api.Models.Auth;
using OpsCommand.Api.Services.Auth;

namespace OpsCommand.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly SignInManager<ApplicationUser> _signInManager;
        private readonly ITokenService _tokenService;

        public AuthController(
            UserManager<ApplicationUser> userManager,
            SignInManager<ApplicationUser> signInManager,
            ITokenService tokenService)
        {
            _userManager = userManager;
            _signInManager = signInManager;
            _tokenService = tokenService;
        }

        // POST: /api/auth/register
        [HttpPost("register")]
        [AllowAnonymous]
        public async Task<IActionResult> Register([FromBody] RegisterRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var existingUser = await _userManager.FindByEmailAsync(request.Email);
            if (existingUser != null)
                return BadRequest("User with this email already exists.");

            var user = new ApplicationUser
            {
                UserName = string.IsNullOrWhiteSpace(request.UserName) ? request.Email : request.UserName,
                Email = request.Email,
                AssignedSquadId = null // Recruit nema jedinicu
            };

            var result = await _userManager.CreateAsync(user, request.Password);

            if (!result.Succeeded)
            {
                return BadRequest(result.Errors);
            }

            // Default role = Recruit
            await _userManager.AddToRoleAsync(user, "Recruit");

            return Ok("User registered successfully.");
        }

        // POST: /api/auth/login
        [HttpPost("login")]
        [AllowAnonymous]
        public async Task<ActionResult<AuthResponse>> Login([FromBody] LoginRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var user = await _userManager.FindByEmailAsync(request.Email);
            if (user == null)
                return Unauthorized("Invalid credentials.");

            var passwordValid = await _userManager.CheckPasswordAsync(user, request.Password);
            if (!passwordValid)
                return Unauthorized("Invalid credentials.");


            //CHECK IF USER IS DISABLED
            if (await _userManager.IsLockedOutAsync(user))
            {
                return StatusCode(StatusCodes.Status403Forbidden,
                    new { message = "User disabled, contact Administrator." });
            }

            var token = await _tokenService.GenerateTokenAsync(user);
            var roles = await _userManager.GetRolesAsync(user);

            var response = new AuthResponse
            {
                Token = token,
                Email = user.Email!,
                UserName = user.UserName,
                Roles = roles
            };

            return Ok(response);
        }

        // GET: /api/auth/me
        [HttpGet("me")]
        [Authorize]
        public async Task<ActionResult<AuthResponse>> Me()
        {
            var userId = _userManager.GetUserId(User);
            if (userId == null)
                return Unauthorized();

            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
                return Unauthorized();

            var roles = await _userManager.GetRolesAsync(user);
            // ne moramo generirati novi token ovdje, vraćamo samo informacije
            var response = new AuthResponse
            {
                Token = string.Empty, // ili null, front ne mora koristiti ovdje
                Email = user.Email!,
                UserName = user.UserName,
                Roles = roles
            };

            return Ok(response);
        }
    }
}
