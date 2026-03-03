using OpsCommand.Api.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace OpsCommand.Api.Repositories.Missions
{
    public interface IMissionRepository
    {
        Task<List<Mission>> GetAllAsync();
        Task<Mission?> GetByIdAsync(int id);
        Task<List<Mission>> GetBySquadIdAsync(int squadId);

        Task AddAsync(Mission mission);
        Task UpdateAsync(Mission mission);
        Task DeleteAsync(Mission mission); //soft delete
        Task<Mission?> GetActiveByCommanderIdAsync(string commanderId, int? excludeMissionId = null);
        Task<Mission?> GetActiveBySquadIdAsync(int squadId, int? excludeMissionId = null);
    }
}
