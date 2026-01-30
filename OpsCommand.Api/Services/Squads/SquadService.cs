using Microsoft.AspNetCore.Identity;
using OpsCommand.Api.Domain.Entities;
using OpsCommand.Api.Models.Squads;
using OpsCommand.Api.Repositories.Squads;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace OpsCommand.Api.Services.Squads
{


    public class SquadService : ISquadService
    {
        private readonly ISquadRepository _squadRepository;
        private readonly UserManager<ApplicationUser> _userManager;
        public SquadService(ISquadRepository squadRepository, UserManager<ApplicationUser> userManager)
        { 
            _squadRepository = squadRepository;
            _userManager = userManager;
        }

        private static readonly string[] AllowedTypes =
            [
                "Assault",
                "Tactical",
                "Recon"
            ];



        public async Task<IEnumerable<SquadResponseDto>> GetAllAsync()
        {
            var squads = await _squadRepository.GetAllAsync();

            var result = new List<SquadResponseDto>();

            foreach (var squad in squads)
            {
                result.Add(new SquadResponseDto
                {
                    Id = squad.Id,
                    Name = squad.Name,
                    Type = squad.Type,
                    CommanderId = squad.CommanderId,
                    //IsDeployed = squad.IsDeployed,
                    CreatedAt = squad.CreatedAt,
                    DeletedAt = squad.DeletedAt,
                    MissionsServed = squad.MissionsServed,
                    MissionsWon = squad.MissionsWon
                });
            }
            return result;
        }


        public async Task<SquadResponseDto?> GetByIdAsync(int id)
        {
            var squad = await _squadRepository.GetByIdAsync(id);

            if (squad == null)
            {
                return null;
            }

            var result = new SquadResponseDto
            {
                Id = squad.Id,
                Name = squad.Name,
                Type = squad.Type,
                CommanderId = squad.CommanderId,
                //IsDeployed = squad.IsDeployed,
                CreatedAt = squad.CreatedAt,
                DeletedAt = squad.DeletedAt,
                MissionsServed = squad.MissionsServed,
                MissionsWon = squad.MissionsWon
            };

            return result;
        }



        public async Task<SquadResponseDto> CreateAsync(SquadCreateDto dto)
        {
            if (!string.IsNullOrWhiteSpace(dto.CommanderId))

                {
                    var commander = await _userManager.FindByIdAsync(dto.CommanderId);
                if (commander == null)
                {
                    throw new ArgumentException("Commander user not found.");
                }

                if (await _userManager.IsLockedOutAsync(commander))
                    throw new ArgumentException("Commander is inactive");


                var isCommander = await _userManager.IsInRoleAsync(commander, "Commander");

                if (!isCommander )
                {
                    throw new ArgumentException("User is not eligible to be a commander.");
                }
            }
            
            if (!AllowedTypes.Contains(dto.Type))
            {
                throw new ArgumentException("Invalid squad type. ALlowed : Assault, Tactical, Recon");
            }
            
            var squad = new Squad
            {
                Name = dto.Name,
                Type = dto.Type,
                CommanderId = dto.CommanderId,
                CreatedAt = DateTime.UtcNow,
                MissionsServed = 0,
                MissionsWon = 0
            };

            await _squadRepository.AddAsync(squad);

            return new SquadResponseDto
            {
                Id = squad.Id,
                Name = squad.Name,
                Type = squad.Type,
                CommanderId = squad.CommanderId,
                CreatedAt = squad.CreatedAt,
                DeletedAt = squad.DeletedAt,
                MissionsServed = squad.MissionsServed,
                MissionsWon = squad.MissionsWon
            };
        }


        public async Task<SquadResponseDto?> UpdateAsync(int id, SquadUpdateDto dto)
        {
            if (!string.IsNullOrWhiteSpace(dto.CommanderId))
            {
                var commander = await _userManager.FindByIdAsync(dto.CommanderId);

                if (commander == null)
                {
                    throw new ArgumentException("Commander user not found.");
                }

                var isCommander = await _userManager.IsInRoleAsync(commander, "Commander");

                if (!isCommander)
                {
                    throw new ArgumentException("User is not eligible to be a commander.");
                }

                if (await _userManager.IsLockedOutAsync(commander))
                    throw new ArgumentException("Commander is inactive");
            }

            var squad = await _squadRepository.GetByIdAsync(id);

            if (squad == null)
                return null;

            if (dto.ClearCommander && !string.IsNullOrWhiteSpace(dto.CommanderId))
                throw new ArgumentException("Cannot set CommanderId and ClearCommander=true at the same time.");

            if (dto.ClearCommander)
            {
                squad.CommanderId = null;
            }

            else if (!string.IsNullOrWhiteSpace(dto.CommanderId))
                squad.CommanderId = dto.CommanderId;

            if (!string.IsNullOrWhiteSpace(dto.Name)) 
                squad.Name = dto.Name;

            if (!string.IsNullOrWhiteSpace(dto.Type))
            {
                if (!AllowedTypes.Contains(dto.Type))
                    throw new ArgumentException("Invalid squad type. ALlowed : Assault, Tactical, Recon");
                
                squad.Type = dto.Type;
            }

            await _squadRepository.UpdateAsync(squad);

            return new SquadResponseDto
            {
                Id = squad.Id,
                Name = squad.Name,
                Type = squad.Type,
                CommanderId = squad.CommanderId,
                CreatedAt = squad.CreatedAt,
                DeletedAt = squad.DeletedAt,
                MissionsServed = squad.MissionsServed,
                MissionsWon = squad.MissionsWon
            };
        }


        public async Task<bool>DeleteAsync(int id)
        {
            var squad = await _squadRepository.GetByIdAsync(id);
            if (squad == null)
                return false;

            await _squadRepository.DeleteAsync(squad);
            return true;
        }
    }
}
