using Microsoft.EntityFrameworkCore;
using OpsCommand.Api.Domain.Entities;
using OpsCommand.Api.Infrastructure.Data;

namespace OpsCommand.Api.Repositories.UserEquipments
{
    public class UserEquipmentRepository : IUserEquipmentRepository
    {
        private readonly ApplicationDbContext _context;

        public UserEquipmentRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<List<UserEquipment>> GetByUserIdAsync(string userId)
        {
            return await _context.UserEquipments
                .Include(ue => ue.Equipment)
                .Where(ue => ue.UserId == userId)
                .ToListAsync();
        }

        public async Task<UserEquipment?> GetByIdAsync(string userId, int equipmentId)
        {
            return await _context.UserEquipments
                .Include(ue => ue.Equipment)
                .FirstOrDefaultAsync(ue => ue.UserId == userId && ue.EquipmentId == equipmentId);
        }

        public async Task AddAsync(UserEquipment userEquipment)
        {
            _context.UserEquipments.Add(userEquipment);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateAsync(UserEquipment userEquipment)
        {
            _context.UserEquipments.Update(userEquipment);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteAsync(UserEquipment userEquipment)
        {
            _context.UserEquipments.Remove(userEquipment);
            await _context.SaveChangesAsync();
        }


        public async Task<List<UserEquipment>> GetBySquadIdAsync(int squadId)
        {
            var now = DateTimeOffset.UtcNow;

            return await _context.UserEquipments
                .Include(ue => ue.Equipment)
                .Include(ue => ue.User)
                .Where(ue =>
                    ue.User.AssignedSquadId == squadId &&
                    (ue.User.LockoutEnd == null || ue.User.LockoutEnd <= now))
                .ToListAsync();
        }

        public async Task<int> GetTotalAllocatedQuantityForEquipmentAsync(int squadId, int equipmentId)
        {
            var now = DateTimeOffset.UtcNow;

            return await _context.UserEquipments
                .Include(ue => ue.User)
                .Where(ue =>
                    ue.EquipmentId == equipmentId &&
                    ue.User.AssignedSquadId == squadId &&
                    (ue.User.LockoutEnd == null || ue.User.LockoutEnd <= now))
                .SumAsync(ue => ue.Quantity);
        }
    }
}