using OpsCommand.Api.Models.Missions;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace OpsCommand.Api.Services.Missions
{
    public interface IMissionService
    {
        Task<List<MissionResponseDto>> GetAllAsync();
        Task<MissionResponseDto?> GetByIdAsync(int id);
        Task<MissionResponseDto> CreateAsync(MissionCreateDto dto, string createdByUserId);
        Task<MissionResponseDto?> UpdateAsync(int id, MissionUpdateDto dto);
        Task<bool> DeleteAsync(int id);

        Task<MissionResponseDto?> AssignCommanderAsync(int missionId, string commanderId);
        Task<MissionResponseDto?> UnassignCommanderAsync(int missionId);
        Task<List<MissionResponseDto>> GetMyMissionsAsync(string userId);

        Task<MissionResponseDto?> ActivateAsync(int missionId);
        Task<MissionResponseDto?> CompleteAsync(int missionId, string? notes);
        Task<MissionResponseDto?> CancelAsync(int missionId, string? notes);
        Task<MissionExecutionResponseDto?> ExecuteAsync(int missionId);
        Task<MissionReadinessResponseDto?> GetReadinessAsync(int missionId);
    }
}
