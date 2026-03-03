using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection.Metadata.Ecma335;
using System.Text;
using System.Threading.Tasks;


using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OpsCommand.Api.Domain.Entities;
using OpsCommand.Api.Models.Squads;
using OpsCommand.Api.Services.Squads;

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



        //GET api/squad
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var squads = await _squadService.GetAllAsync();
            return Ok(squads);
        }

        //GET api/squad/id
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var squad = await _squadService.GetByIdAsync(id);

            if (squad == null)
                return NotFound();

            return Ok(squad);
        }



        //POST api/squad
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

        //PUT api/squad/{id}
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


        // DELETE api/squad{id}
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin,SuperAdmin")]
        public async Task<IActionResult>Delete(int id)
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
