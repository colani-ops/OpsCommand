using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OpsCommand.Api.Models.UserEquipment;
using OpsCommand.Api.Services.UserEquipments;

namespace OpsCommand.Api.Controllers
{
    [ApiController]
    [Route("api/userequipment")]
    [Authorize(Roles = "Member,Commander")]
    public class UserEquipmentController : ControllerBase
    {
        private readonly IUserEquipmentService _service;

        public UserEquipmentController(IUserEquipmentService service)
        {
            _service = service;
        }

        [HttpGet("available")]
        public async Task<IActionResult> GetAvailable()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrWhiteSpace(userId))
                return Unauthorized();

            var result = await _service.GetAvailableForMeAsync(userId);
            return Ok(result);
        }

        [HttpGet("me")]
        public async Task<IActionResult> GetMine()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrWhiteSpace(userId))
                return Unauthorized();

            var result = await _service.GetMineAsync(userId);
            return Ok(result);
        }

        [HttpPost("me")]
        public async Task<IActionResult> AddMine([FromBody] AddUserEquipmentRequest request)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrWhiteSpace(userId))
                return Unauthorized();

            try
            {
                var created = await _service.AddToMeAsync(userId, request);
                return Ok(created);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPut("me/{equipmentId}")]
        public async Task<IActionResult> UpdateMine(int equipmentId, [FromBody] UpdateUserEquipmentRequest request)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrWhiteSpace(userId))
                return Unauthorized();

            try
            {
                var updated = await _service.UpdateMineAsync(userId, equipmentId, request);
                return Ok(updated);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpDelete("me/{equipmentId}")]
        public async Task<IActionResult> DeleteMine(int equipmentId)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrWhiteSpace(userId))
                return Unauthorized();

            var deleted = await _service.DeleteMineAsync(userId, equipmentId);
            if (!deleted)
                return NotFound();

            return NoContent();
        }
    }
}