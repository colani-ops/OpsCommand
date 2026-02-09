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
                    throw new ArgumentException("Commander user not found.");                

                var isCommander = await _userManager.IsInRoleAsync(commander, "Commander");

                if (!isCommander)
                    throw new ArgumentException("User is not eligible to be a commander.");

                var existing = await _squadRepository.GetActiveSquadByCommanderIdAsync(dto.CommanderId);

                if (existing != null)
                    throw new ArgumentException($"Commander is already assigned to squad '{existing.Name}' (Id {existing.Id}).");
                

                if (await _userManager.IsLockedOutAsync(commander))
                    throw new ArgumentException("Commander is inactive");
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
            var squad = await _squadRepository.GetByIdAsync(id);
            if (squad == null) return null;

            //Name / Type / IsActive
            if (!string.IsNullOrWhiteSpace(dto.Name))
                squad.Name = dto.Name;

            if (!string.IsNullOrWhiteSpace(dto.Type))
            {
                if (!AllowedTypes.Contains(dto.Type))
                    throw new ArgumentException("Invalid squad type. Allowed: Assault, Tactical, Recon");

                squad.Type = dto.Type;
            }

            //CommanderId (PUT semantics: null = clear)
            var commanderId = string.IsNullOrWhiteSpace(dto.CommanderId) ? null : dto.CommanderId;

            if (commanderId == null)
            {
                squad.CommanderId = null;
            }
            else
            {
                // 1) commander user must exist
                var commanderUser = await _userManager.FindByIdAsync(commanderId);
                if (commanderUser == null)
                    throw new ArgumentException("Commander user not found.");

                // 2) must have Commander role
                var isCommander = await _userManager.IsInRoleAsync(commanderUser, "Commander");
                if (!isCommander)
                    throw new ArgumentException("User is not eligible to be a commander.");

                // 3) must be active (not locked out)
                if (await _userManager.IsLockedOutAsync(commanderUser))
                    throw new ArgumentException("Commander is inactive.");

                // 4) must not already be assigned as commander to another squad
                var existing = await _squadRepository.GetActiveSquadByCommanderIdAsync(commanderId, excludeSquadId: id);
                if (existing != null)
                    throw new ArgumentException($"Commander is already assigned to squad '{existing.Name}' (Id {existing.Id}).");

                squad.CommanderId = commanderId;
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
