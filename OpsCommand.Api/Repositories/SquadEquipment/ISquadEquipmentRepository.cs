using OpsCommand.Api.Domain.Entities;

namespace OpsCommand.Api.Repositories.SquadEquipments
{
    public interface ISquadEquipmentRepository
    {
        Task<List<SquadEquipment>> GetBySquadIdAsync(int squadId);
        Task<SquadEquipment?> GetByIdsAsync(int squadId, int equipmentId);

        Task AddAsync(SquadEquipment entity);
        Task UpdateAsync(SquadEquipment entity);
        Task DeleteAsync(SquadEquipment entity);
    }
}