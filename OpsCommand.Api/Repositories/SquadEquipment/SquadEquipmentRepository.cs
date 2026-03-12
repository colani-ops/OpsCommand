using Microsoft.EntityFrameworkCore;
using OpsCommand.Api.Domain.Entities;
using OpsCommand.Api.Infrastructure.Data;

namespace OpsCommand.Api.Repositories.SquadEquipments
{
    public class SquadEquipmentRepository : ISquadEquipmentRepository
    {
        private readonly ApplicationDbContext _context;

        public SquadEquipmentRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<List<SquadEquipment>> GetBySquadIdAsync(int squadId)
        {
            return await _context.SquadEquipments
                .Include(se => se.Equipment)
                .Where(se => se.SquadId == squadId && se.Equipment.DeletedAt == null)
                .ToListAsync();
        }

        public async Task<SquadEquipment?> GetByIdsAsync(int squadId, int equipmentId)
        {
            return await _context.SquadEquipments
                .Include(se => se.Equipment)
                .FirstOrDefaultAsync(se => se.SquadId == squadId && se.EquipmentId == equipmentId);
        }

        public async Task AddAsync(SquadEquipment entity)
        {
            await _context.SquadEquipments.AddAsync(entity);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateAsync(SquadEquipment entity)
        {
            _context.SquadEquipments.Update(entity);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteAsync(SquadEquipment entity)
        {
            _context.SquadEquipments.Remove(entity);
            await _context.SaveChangesAsync();
        }
    }
}