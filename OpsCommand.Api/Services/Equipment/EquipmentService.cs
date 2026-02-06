using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

using OpsCommand.Api.Domain.Entities;
using OpsCommand.Api.Models.Equipment;
using OpsCommand.Api.Repositories.Equipments;

namespace OpsCommand.Api.Services.Equipments
{
    public class EquipmentService : IEquipmentService
    {
        private readonly IEquipmentRepository _repository;

        public EquipmentService(IEquipmentRepository repository)
        {
            _repository = repository;
        }

        public async Task<List<EquipmentResponse>> GetAllAsync()
        {
            var items = await _repository.GetAllAsync();

            return items.Select(e => new EquipmentResponse
            {
                Id = e.Id,
                Name = e.Name,
                Category = e.Category
            }).ToList();
        }

        public async Task<EquipmentResponse> GetByIdAsync(int id)
        {
            var equipment = await _repository.GetByIdAsync(id)
                ?? throw new KeyNotFoundException("Equipment not found");

            return new EquipmentResponse
            {
                Id = equipment.Id,
                Name = equipment.Name,
                Category = equipment.Category
            };
        }

        public async Task CreateAsync(CreateEquipmentRequest request)
        {
            var equipment = new Equipment
            {
                Name = request.Name,
                Category = request.Category
            };

            await _repository.AddAsync(equipment);
        }

        public async Task UpdateAsync(int id, UpdateEquipmentRequest request)
        {
            var equipment = await _repository.GetByIdAsync(id)
                ?? throw new KeyNotFoundException("Equipment not found");

            equipment.Name = request.Name;
            equipment.Category = request.Category;

            await _repository.UpdateAsync(equipment);
        }

        public async Task DeleteAsync(int id)
        {
            var equipment = await _repository.GetByIdAsync(id)
                ?? throw new KeyNotFoundException("Equipment not found");

            equipment.DeletedAt = DateTime.UtcNow;

            await _repository.UpdateAsync(equipment);
        }
    }
}
