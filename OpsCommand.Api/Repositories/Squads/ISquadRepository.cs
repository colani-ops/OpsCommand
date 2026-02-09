using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

using OpsCommand.Api.Domain.Entities;

namespace OpsCommand.Api.Repositories.Squads


{
    public interface ISquadRepository
    {
        Task<IEnumerable<Squad>> GetAllAsync();
        Task<Squad?> GetByIdAsync(int id);
        Task AddAsync(Squad squad);
        Task UpdateAsync(Squad squad);
        Task DeleteAsync(Squad squad);
        Task<Squad?> GetActiveSquadByCommanderIdAsync(string commanderId, int? excludeSquadId = null);
    }
}
