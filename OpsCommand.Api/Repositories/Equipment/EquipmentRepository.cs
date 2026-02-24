using Microsoft.EntityFrameworkCore;
using OpsCommand.Api.Domain.Entities;
using OpsCommand.Api.Infrastructure.Data;

namespace OpsCommand.Api.Repositories.Equipments
{
    public class EquipmentRepository : IEquipmentRepository
    {
        private readonly ApplicationDbContext _context;

        public EquipmentRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<List<Equipment>> GetAllAsync(bool includeDeleted = false)
        {
            var query = _context.Equipments.AsQueryable();
            if (!includeDeleted) query = query.Where(equipment => equipment.DeletedAt == null);
            return await query.ToListAsync();
        }

        public async Task<Equipment?> GetByIdAsync(int id, bool includeDeleted = false)
        {
            var query = _context.Equipments.AsQueryable();
            if (!includeDeleted) query = query.Where(equipment => equipment.DeletedAt == null);
            return await query.FirstOrDefaultAsync(equipment => equipment.Id == id);
        }

        public async Task<Equipment?> GetByNameAsync(string name, bool includeDeleted = false)
        {
            var normalizedName = name.Trim();
            var query = _context.Equipments.AsQueryable();
            if (!includeDeleted) query = query.Where(equipment => equipment.DeletedAt == null);
            return await query.FirstOrDefaultAsync(equipment => equipment.Name == normalizedName);
        }

        public async Task AddAsync(Equipment equipment)
        {
            _context.Equipments.Add(equipment);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateAsync(Equipment equipment)
        {
            _context.Equipments.Update(equipment);
            await _context.SaveChangesAsync();
        }
    }
}