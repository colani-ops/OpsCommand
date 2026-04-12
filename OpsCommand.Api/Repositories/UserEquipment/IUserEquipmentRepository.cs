using OpsCommand.Api.Domain.Entities;

namespace OpsCommand.Api.Repositories.UserEquipments
{
    public interface IUserEquipmentRepository
    {
        Task<List<UserEquipment>> GetByUserIdAsync(string userId);
        Task<UserEquipment?> GetByIdAsync(string userId, int equipmentId);
        Task AddAsync(UserEquipment userEquipment);
        Task UpdateAsync(UserEquipment userEquipment);
        Task DeleteAsync(UserEquipment userEquipment);

        Task<List<UserEquipment>> GetBySquadIdAsync(int squadId);
        Task<int> GetTotalAllocatedQuantityForEquipmentAsync(int squadId, int equipmentId);
    }
}