using OpsCommand.Api.Models.UserEquipment;

namespace OpsCommand.Api.Services.UserEquipments
{
    public interface IUserEquipmentService
    {
        Task<List<UserEquipmentResponseDto>> GetAvailableForMeAsync(string userId);
        Task<List<UserEquipmentResponseDto>> GetMineAsync(string userId);
        Task<UserEquipmentResponseDto> AddToMeAsync(string userId, AddUserEquipmentRequest request);
        Task<UserEquipmentResponseDto> UpdateMineAsync(string userId, int equipmentId, UpdateUserEquipmentRequest request);
        Task<bool> DeleteMineAsync(string userId, int equipmentId);
    }
}