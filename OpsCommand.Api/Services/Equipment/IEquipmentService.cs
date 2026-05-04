using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using OpsCommand.Api.Models.Equipment;

namespace OpsCommand.Api.Services.Equipments
{
    public interface IEquipmentService
    {
        Task<List<EquipmentResponse>> GetAllAsync(bool includeDeleted = false);
        Task<EquipmentResponse> GetByIdAsync(int id, bool includeDeleted = false);

        Task<EquipmentResponse> CreateAsync(CreateEquipmentRequest request);
        Task<EquipmentResponse> UpdateAsync(int id, UpdateEquipmentRequest request);

        Task<EquipmentResponse?> UploadImageAsync(int id, IFormFile file);
        Task<EquipmentResponse?> RemoveImageAsync(int id);

        Task DeleteAsync(int id);
    }
}