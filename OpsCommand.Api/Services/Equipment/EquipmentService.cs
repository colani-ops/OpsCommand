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

            return items.Select(equipment => new EquipmentResponse
            {
                Id = equipment.Id,
                Name = equipment.Name,
                Category = equipment.Category,
                Quantity = equipment.Quantity
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
                Category = equipment.Category,
                Quantity = equipment.Quantity
            };
        }

        private static readonly HashSet<string> AllowedCategories =
            new(StringComparer.OrdinalIgnoreCase) { "Primary", "Secondary", "Melee", "Utility" };

        public async Task CreateAsync(CreateEquipmentRequest request)
        {
            var name = request.Name.Trim();
            if (string.IsNullOrWhiteSpace(name))
                throw new ArgumentException("Name is required.");

            if (!string.IsNullOrWhiteSpace(request.Category) && !AllowedCategories.Contains(request.Category))
                throw new ArgumentException("Invalid category. Allowed: Primary, Secondary, Melee, Utility.");

            if (request.Quantity < 0)
                throw new ArgumentException("Quantity cannot be negative.");

            // find including deleted for restore
            var existing = await _repository.GetByNameAsync(name, includeDeleted: true);

            if (existing != null)
            {
                // restore if needed
                if (existing.DeletedAt != null)
                    existing.DeletedAt = null;

                // keep name stable; update category if provided
                existing.Category = request.Category;

                // "add stock" semantics
                existing.Quantity += request.Quantity;

                await _repository.UpdateAsync(existing);
                return;
            }

            var equipment = new Equipment
            {
                Name = name,
                Category = request.Category,
                Quantity = request.Quantity
            };

            await _repository.AddAsync(equipment);
        }

        public async Task UpdateAsync(int id, UpdateEquipmentRequest request)
        {
            var equipment = await _repository.GetByIdAsync(id)
                ?? throw new KeyNotFoundException("Equipment not found");

            if (!string.IsNullOrWhiteSpace(request.Category) && !AllowedCategories.Contains(request.Category))
                throw new ArgumentException("Invalid category. Allowed: Primary, Secondary, Melee, Utility.");

            if (request.Quantity < 0)
                throw new ArgumentException("Quantity cannot be negative.");

            equipment.Category = request.Category;
            equipment.Quantity = request.Quantity;

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
