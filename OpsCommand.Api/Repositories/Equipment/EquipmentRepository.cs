using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

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

        public async Task<List<Equipment>> GetAllAsync()
        {
            return await _context.Equipments
                .Where(e => e.DeletedAt == null)
                .ToListAsync();
        }

        public async Task<Equipment?> GetByIdAsync(int id)
        {
            return await _context.Equipments
                .FirstOrDefaultAsync(e => e.Id == id && e.DeletedAt == null);
        }

        public async Task<Equipment?> GetByNameAsync(string name, bool includeDeleted = false)
        {
            var q = _context.Equipments.AsQueryable();
            if (!includeDeleted) q = q.Where(e => e.DeletedAt == null);

            return await q.FirstOrDefaultAsync(e => e.Name == name);
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
