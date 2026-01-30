using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OpsCommand.Api.Models.Missions;
using OpsCommand.Api.Services.Missions;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;

namespace OpsCommand.Api.Controllers
{

    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class MissionController : ControllerBase
    {
        private readonly IMissionService _missionService;

        public MissionController(IMissionService missionService)
        {
            _missionService = missionService;
        }

        //GET api/mission
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var missions = await _missionService.GetAllAsync();
            return Ok(missions);
        }



        //GET api/mission/id
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var mission = await _missionService.GetByIdAsync(id);

            if (mission == null)
            {
                return NotFound();
            }

            return Ok(mission);
        }



        //GET api/mission/my
        [HttpGet("my")]
        [Authorize] //All users
        public async Task<IActionResult> GetMyMissions()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrWhiteSpace(userId))
                return Unauthorized();

            var missions = await _missionService.GetMyMissionsAsync(userId);
            return Ok(missions);
        }



        //POST api/mission
        [HttpPost]
        [Authorize(Roles = "Admin, SuperAdmin")]
        public async Task<IActionResult> Create([FromBody] MissionCreateDto dto)
        {

            //Grab bearer token from logged in user.
            var createdByUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrWhiteSpace(createdByUserId))
            {
                return Unauthorized();
            }

            try
            {
                var createdMission = await _missionService.CreateAsync(dto, createdByUserId);

                return CreatedAtAction(nameof(GetById),
                    new
                    { id = createdMission.Id },
                    createdMission);
            }
            catch (ArgumentException exception)
            {
                return BadRequest(exception.Message);
            }
        }

        //PUT api/mission/{id}
        [HttpPut("{id}")]
        [Authorize(Roles = "Admin, SuperAdmin")]
        public async Task<IActionResult> Update(int id, [FromBody] MissionUpdateDto dto)
        {
            var updatedMission = await _missionService.UpdateAsync(id, dto);
            if (updatedMission == null)
            {
                return NotFound();
            }
            return Ok(updatedMission);
        }

        [HttpPatch("{id}/commander")]
        [Authorize(Roles = "Admin,SuperAdmin")]
        public async Task<IActionResult> AssignCommander(int id, [FromBody] AssignCommanderDto dto)
        {
            try
            {
                var updated = await _missionService.AssignCommanderAsync(id, dto.CommanderId);
                if (updated == null) return NotFound();
                return Ok(updated);
            }
                catch (ArgumentException ex)
                {
                return BadRequest(ex.Message);
                }
        }



        // DELETE api/mission/{id}/commander
        [HttpDelete("{id}/commander")]
        [Authorize(Roles = "Admin,SuperAdmin")]
        public async Task<IActionResult> UnassignCommander(int id)
        {
            try
            {
                var updated = await _missionService.UnassignCommanderAsync(id);
                if (updated == null) return NotFound();
                return Ok(updated);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
        }



        //DELETE api/mission/{id}
        [HttpDelete("{id}")]
            [Authorize(Roles = "Admin, SuperAdmin")]
            public async Task<IActionResult> Delete(int id)
            {
                var success = await _missionService.DeleteAsync(id);
                if (!success)
                {
                    return NotFound();
                }
                return NoContent();
            }
        }
    } 
