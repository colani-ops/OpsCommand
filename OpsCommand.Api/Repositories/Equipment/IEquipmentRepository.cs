using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

using OpsCommand.Api.Domain.Entities;

namespace OpsCommand.Api.Repositories.Equipments
{
    public interface IEquipmentRepository
    {
        Task<List<Equipment>> GetAllAsync(bool includeDeleted = false);
        Task<Equipment?> GetByIdAsync(int id, bool includeDeleted = false);
        Task<Equipment?> GetByNameAsync(string name, bool includeDeleted = false);

        Task AddAsync(Equipment equipment);
        Task UpdateAsync(Equipment equipment);
    }
}

