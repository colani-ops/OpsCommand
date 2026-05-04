using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OpsCommand.Api.Models.Equipment;
using OpsCommand.Api.Services.Equipments;

namespace OpsCommand.Api.Controllers
{
    [ApiController]
    [Route("api/equipment")]
    [Authorize]
    public class EquipmentController : ControllerBase
    {
        private readonly IEquipmentService _service;

        public EquipmentController(IEquipmentService service)
        {
            _service = service;
        }

        [HttpGet]
        [Authorize(Roles = "Commander,Admin,SuperAdmin")]
        public async Task<IActionResult> GetAll([FromQuery] bool includeDeleted = false)
        {
            return Ok(await _service.GetAllAsync(includeDeleted));
        }

        [HttpGet("{id}")]
        [Authorize(Roles = "Member,Commander,Admin,SuperAdmin")]
        public async Task<IActionResult> GetById(int id, [FromQuery] bool includeDeleted = false)
        {
            return Ok(await _service.GetByIdAsync(id, includeDeleted));
        }

        [HttpPost]
        [Authorize(Roles = "Admin,SuperAdmin")]
        public async Task<IActionResult> Create([FromBody] CreateEquipmentRequest request)
        {
            var createdOrUpdated = await _service.CreateAsync(request);
            return Ok(createdOrUpdated);
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin,SuperAdmin")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateEquipmentRequest request)
        {
            var updated = await _service.UpdateAsync(id, request);
            return Ok(updated);
        }

        [HttpPut("{id}/image")]
        [Authorize(Roles = "Admin,SuperAdmin")]
        public async Task<IActionResult> UploadImage(int id, IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest(new { message = "No file uploaded." });

            try
            {
                var updated = await _service.UploadImageAsync(id, file);
                if (updated == null)
                    return NotFound();

                return Ok(updated);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpDelete("{id}/image")]
        [Authorize(Roles = "Admin,SuperAdmin")]
        public async Task<IActionResult> RemoveImage(int id)
        {
            var updated = await _service.RemoveImageAsync(id);
            if (updated == null)
                return NotFound();

            return Ok(updated);
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin,SuperAdmin")]
        public async Task<IActionResult> Delete(int id)
        {
            await _service.DeleteAsync(id);
            return NoContent();
        }
    }
}