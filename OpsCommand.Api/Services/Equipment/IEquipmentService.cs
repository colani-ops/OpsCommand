using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

using OpsCommand.Api.Models.Equipment;

namespace OpsCommand.Api.Services.Equipments
{
    public interface IEquipmentService
    {
        Task<List<EquipmentResponse>> GetAllAsync();
        Task<EquipmentResponse> GetByIdAsync(int id);
        Task CreateAsync(CreateEquipmentRequest request);
        Task UpdateAsync(int id, UpdateEquipmentRequest request);
        Task DeleteAsync(int id);
    }
}
