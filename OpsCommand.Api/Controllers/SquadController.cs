using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OpsCommand.Api.Services.Squads;
using OpsCommand.Api.Models.Squads;
using Microsoft.AspNetCore.Http;

namespace OpsCommand.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "SuperAdmin,Admin,Commander,Member,Recruit")]
    public class SquadController : ControllerBase
    {
        private readonly ISquadService _squadService;

        public SquadController(ISquadService squadService)
        {
            _squadService = squadService;
        }



        private bool CallerCanManageSquad(SquadProfileResponseDto squad)
        {
            if (User.IsInRole("Admin") || User.IsInRole("SuperAdmin"))
                return true;

            if (!User.IsInRole("Commander"))
                return false;

            var callerUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrWhiteSpace(callerUserId))
                return false;

            return squad.CommanderId == callerUserId;
        }

        private async Task<SquadProfileResponseDto?> GetManagedSquadOrNull(int id)
        {
            var squad = await _squadService.GetProfileByIdAsync(id);
            if (squad == null)
                return null;

            return CallerCanManageSquad(squad) ? squad : null;
        }



        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var squads = await _squadService.GetAllAsync();
            return Ok(squads);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var squad = await _squadService.GetByIdAsync(id);

            if (squad == null)
                return NotFound();

            return Ok(squad);
        }

        [HttpGet("my")]
        [Authorize(Roles = "Member,Commander,Admin,SuperAdmin")]
        public async Task<IActionResult> GetMySquad()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrWhiteSpace(userId))
                return Unauthorized();

            var squad = await _squadService.GetMySquadAsync(userId);

            return Ok(squad);
        }

        [HttpGet("{id}/profile")]
        [Authorize(Roles = "Admin,SuperAdmin,Commander")]
        public async Task<IActionResult> GetProfile(int id)
        {
            var squad = await _squadService.GetProfileByIdAsync(id);
            if (squad == null)
                return NotFound();

            if (User.IsInRole("Admin") || User.IsInRole("SuperAdmin"))
                return Ok(squad);

            var callerUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrWhiteSpace(callerUserId))
                return Unauthorized();

            if (squad.CommanderId != callerUserId)
                return Forbid();

            return Ok(squad);
        }

        [HttpPut("{id}/banner")]
        [Authorize(Roles = "Admin,SuperAdmin,Commander")]
        public async Task<IActionResult> UploadBanner(int id, IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest(new { message = "No file uploaded." });

            var managedSquad = await GetManagedSquadOrNull(id);
            if (managedSquad == null)
                return Forbid();

            try
            {
                var updated = await _squadService.UploadBannerAsync(id, file);
                if (updated == null)
                    return NotFound();

                return Ok(updated);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpDelete("{id}/banner")]
        [Authorize(Roles = "Admin,SuperAdmin,Commander")]
        public async Task<IActionResult> RemoveBanner(int id)
        {
            var managedSquad = await GetManagedSquadOrNull(id);
            if (managedSquad == null)
                return Forbid();

            var updated = await _squadService.RemoveBannerAsync(id);
            if (updated == null)
                return NotFound();

            return Ok(updated);
        }

        [HttpPost]
        [Authorize(Roles = "Admin,SuperAdmin")]
        public async Task<IActionResult> Create([FromBody] SquadCreateDto dto)
        {
            try
            {
                var createdSquad = await _squadService.CreateAsync(dto);
                return CreatedAtAction(nameof(GetById), new { id = createdSquad.Id }, createdSquad);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin,SuperAdmin")]
        public async Task<IActionResult> Update(int id, [FromBody] SquadUpdateDto dto)
        {
            try
            {
                var updatedSquad = await _squadService.UpdateAsync(id, dto);
                if (updatedSquad == null) return NotFound();
                return Ok(updatedSquad);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin,SuperAdmin")]
        public async Task<IActionResult> Delete(int id)
        {
            var success = await _squadService.DeleteAsync(id);
            if (!success)
            {
                return NotFound();
            }

            return NoContent();
        }
    }
}