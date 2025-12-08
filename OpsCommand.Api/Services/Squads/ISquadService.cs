using OpsCommand.Api.Domain.Entities;
using OpsCommand.Api.Models.Squads;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace OpsCommand.Api.Services.Squads
{
    public interface ISquadService
    {
        Task<IEnumerable<SquadResponseDto>> GetAllAsync();
        Task<SquadResponseDto> GetByIdAsync(int id);

        Task<SquadResponseDto> CreateAsync(SquadCreateDto dto);

        Task<SquadResponseDto> UpdateAsync(int id, SquadUpdateDto dto);

        Task<bool> DeleteAsync(int id);
    }
}
