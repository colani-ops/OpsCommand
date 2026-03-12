using OpsCommand.Api.Models.Squads.Equipment;

namespace OpsCommand.Api.Services.SquadEquipments
{
    public interface ISquadEquipmentService
    {
        Task<List<SquadEquipmentResponseDto>> GetBySquadIdAsync(int squadId, string userId, bool isAdmin);
        Task<SquadEquipmentResponseDto> AddAsync(int squadId, AddSquadEquipmentRequest request, string userId, bool isAdmin);
        Task<SquadEquipmentResponseDto> UpdateAsync(int squadId, int equipmentId, UpdateSquadEquipmentRequest request, string userId, bool isAdmin);
        Task DeleteAsync(int squadId, int equipmentId, string userId, bool isAdmin);
    }
}