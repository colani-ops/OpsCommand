using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OpsCommand.Api.Models.Squads.Equipment;
using OpsCommand.Api.Services.SquadEquipments;

namespace OpsCommand.Api.Controllers
{
    [ApiController]
    [Route("api/squad/{squadId:int}/equipment")]
    [Authorize]
    public class SquadEquipmentController : ControllerBase
    {
        private readonly ISquadEquipmentService _service;

        public SquadEquipmentController(ISquadEquipmentService service)
        {
            _service = service;
        }



        [HttpGet]
        [Authorize(Roles = "Member,Commander,Admin,SuperAdmin")]
        public async Task<IActionResult> GetAll(int squadId)
        {
            try
            {
                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrWhiteSpace(userId))
                    return Unauthorized();

                var isAdmin = User.IsInRole("Admin") || User.IsInRole("SuperAdmin");

                var result = await _service.GetBySquadIdAsync(squadId, userId, isAdmin);
                return Ok(result);
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(StatusCodes.Status403Forbidden, new { message = ex.Message });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }



        [HttpPost]
        [Authorize(Roles = "Commander,Admin,SuperAdmin")]
        public async Task<IActionResult> Add(int squadId, [FromBody] AddSquadEquipmentRequest request)
        {
            try
            {
                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrWhiteSpace(userId))
                    return Unauthorized();

                var isAdmin = User.IsInRole("Admin") || User.IsInRole("SuperAdmin");

                var created = await _service.AddAsync(squadId, request, userId, isAdmin);
                return Ok(created);
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(StatusCodes.Status403Forbidden, new { message = ex.Message });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }

        [HttpPut("{equipmentId:int}")]
        [Authorize(Roles = "Commander,Admin,SuperAdmin")]
        public async Task<IActionResult> Update(int squadId, int equipmentId, [FromBody] UpdateSquadEquipmentRequest request)
        {
            try
            {
                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrWhiteSpace(userId))
                    return Unauthorized();

                var isAdmin = User.IsInRole("Admin") || User.IsInRole("SuperAdmin");

                var updated = await _service.UpdateAsync(squadId, equipmentId, request, userId, isAdmin);
                return Ok(updated);
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(StatusCodes.Status403Forbidden, new { message = ex.Message });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }

        [HttpDelete("{equipmentId:int}")]
        [Authorize(Roles = "Commander,Admin,SuperAdmin")]
        public async Task<IActionResult> Delete(int squadId, int equipmentId)
        {
            try
            {
                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrWhiteSpace(userId))
                    return Unauthorized();

                var isAdmin = User.IsInRole("Admin") || User.IsInRole("SuperAdmin");

                await _service.DeleteAsync(squadId, equipmentId, userId, isAdmin);
                return NoContent();
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(StatusCodes.Status403Forbidden, new { message = ex.Message });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }
    }
}