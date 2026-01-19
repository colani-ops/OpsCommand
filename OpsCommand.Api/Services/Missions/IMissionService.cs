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

        Task<List<MissionResponseDto>> GetMyMissionsAsync(string userId);

    }
}
