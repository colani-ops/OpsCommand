using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

using Microsoft.EntityFrameworkCore;
using OpsCommand.Api.Domain.Entities;
using OpsCommand.Api.Infrastructure.Data;

namespace OpsCommand.Api.Repositories.Missions
{
    public class MissionRepository : IMissionRepository
    {
        private readonly ApplicationDbContext _context;

        public MissionRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<List<Mission>> GetAllAsync()
        {
            
            //Soft Delete Filter
            return await _context.Missions
                .Where(m => m.DeletedAt == null)
                .ToListAsync();
        }



        public async Task<Mission?> GetByIdAsync(int id)
        {
            return await _context.Missions
            .FirstOrDefaultAsync(m => m.Id == id && m.DeletedAt == null);
        }


        public async Task<List<Mission>> GetBySquadIdAsync(int squadId)
        {
            return await _context.Missions
                .Where(m => m.DeletedAt == null && m.SquadId == squadId)
                .ToListAsync();
        }




        public async Task AddAsync(Mission mission)
        {
            await _context.Missions.AddAsync(mission);
            await _context.SaveChangesAsync();
        }



        public async Task UpdateAsync(Mission mission)
        {
            _context.Missions.Update(mission);
            await _context.SaveChangesAsync();
        }


        public async Task DeleteAsync(Mission mission)
        {
            mission.DeletedAt = DateTime.UtcNow;
            _context.Missions.Update(mission);
            await _context.SaveChangesAsync();
        }


        public async Task<Mission?> GetActiveByCommanderIdAsync(string commanderId, int? excludeMissionId = null)
        {
            var query = _context.Missions
                .Where(mission => mission.DeletedAt == null && mission.Status == "Active" && mission.CommanderId == commanderId);

            if (excludeMissionId.HasValue)
                query = query.Where(mission => mission.Id != excludeMissionId.Value);

            return await query.FirstOrDefaultAsync();
        }

        public async Task<Mission?> GetActiveBySquadIdAsync(int squadId, int? excludeMissionId = null)
        {
            var query = _context.Missions
                .Where(mission => mission.DeletedAt == null && mission.Status == "Active" && mission.SquadId == squadId);

            if (excludeMissionId.HasValue)
                query = query.Where(mission => mission.Id != excludeMissionId.Value);

            return await query.FirstOrDefaultAsync();
        }

        public async Task<bool> HasOpenMissionsForCommanderInSquadAsync(string commanderId, int squadId)
        {
            return await _context.Missions.AnyAsync(m =>
                m.DeletedAt == null &&
                m.CommanderId == commanderId &&
                m.SquadId == squadId &&
                m.Status != "Completed" &&
                m.Status != "Cancelled");
        }
    }
}
