using Microsoft.AspNetCore.Identity;
using Microsoft.Identity.Client;
using OpsCommand.Api.Domain.Entities;
using OpsCommand.Api.Infrastructure.Data;
using OpsCommand.Api.Models.Squads;
using OpsCommand.Api.Repositories.Squads;
using System;
using System.Collections.Generic;
using System.Formats.Asn1;
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

        private static readonly string[] AllowedTypes = new[]
            {
                "Assault",
                "Tactical",
                "Recon"
            };



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
                    IsActive = squad.IsActive,
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
                IsActive = squad.IsActive,
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
            if (dto.CommanderId != null)
            {
                var commander = await _userManager.FindByIdAsync(dto.CommanderId);
                if (commander == null)
                {
                    throw new ArgumentException("Commander user not found.");
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
                IsActive = true,
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
                IsActive = squad.IsActive,
                MissionsServed = squad.MissionsServed,
                MissionsWon = squad.MissionsWon
            };
        }

        public async Task<SquadResponseDto?> UpdateAsync(int id, SquadUpdateDto dto)
        {
            if (dto.CommanderId != null)
            {
                var commander = await _userManager.FindByIdAsync(dto.CommanderId);
                if (commander == null)
                {
                    throw new ArgumentException("Commander user not found.");
                }
            }

            if (!AllowedTypes.Contains(dto.Type))
            {
                throw new ArgumentException("Invalid squad type. ALlowed : Assault, Tactical, Recon");
            }

            var squad = await _squadRepository.GetByIdAsync(id);

            if (squad == null)
                return null;

            squad.Name = dto.Name;
            squad.Type = dto.Type;
            squad.CommanderId = dto.CommanderId;
            squad.IsActive = dto.IsActive;

            if (!AllowedTypes.Contains(dto.Type))
            {
                throw new ArgumentException("Invalid squad type. ALlowed : Assault, Tactical, Recon");
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
                IsActive = squad.IsActive,
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
