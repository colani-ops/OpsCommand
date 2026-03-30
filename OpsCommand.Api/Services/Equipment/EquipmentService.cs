using OpsCommand.Api.Domain.Entities;
using OpsCommand.Api.Models.Equipment;
using OpsCommand.Api.Repositories.Equipments;
using OpsCommand.Api.Services.Equipments;
using Microsoft.EntityFrameworkCore;
using OpsCommand.Api.Infrastructure.Data;

public class EquipmentService : IEquipmentService
{
    private readonly IEquipmentRepository _repository;

    private readonly ApplicationDbContext _context;



    private static readonly HashSet<string> AllowedCategories =
        new(StringComparer.OrdinalIgnoreCase) { "Primary", "Secondary", "Melee", "Utility" };



    public EquipmentService(IEquipmentRepository repository, ApplicationDbContext context)
    {
        _repository = repository;
        _context = context;
    }



    private static string NormalizeName(string name) => (name ?? "").Trim();



    private static string? NormalizeCategory(string? category)
    {
        if (string.IsNullOrWhiteSpace(category)) return null;
        var c = category.Trim();
        if (!AllowedCategories.Contains(c))
            throw new ArgumentException("Invalid category. Allowed: Primary, Secondary, Melee, Utility");
        return c;
    }



    //Helper for Allocation
    private async Task<(int allocated, int available)> GetAllocationAsync(int equipmentId, int totalQuantity)
    {
        var allocated = await _context.SquadEquipments
            .Where(se => se.EquipmentId == equipmentId)
            .SumAsync(se => (int?)se.Quantity) ?? 0;

        var available = totalQuantity - allocated;
        if (available < 0) available = 0;

        return (allocated, available);
    }



    private async Task<EquipmentResponse> ToDtoWithAllocationAsync(Equipment e)
    {
        var (allocated, available) = await GetAllocationAsync(e.Id, e.Quantity);

        return new EquipmentResponse
        {
            Id = e.Id,
            Name = e.Name,
            Category = e.Category,
            Quantity = e.Quantity,
            DeletedAt = e.DeletedAt,
            Description = e.Description,
            Effectiveness = e.Effectiveness,
            AllocatedQuantity = allocated,
            AvailableQuantity = available
        };
    }



    public async Task<List<EquipmentResponse>> GetAllAsync(bool includeDeleted = false)
    {
        var items = await _repository.GetAllAsync(includeDeleted);

        var result = new List<EquipmentResponse>();

        foreach (var e in items)
        {
            var (allocated, available) = await GetAllocationAsync(e.Id, e.Quantity);

            result.Add(new EquipmentResponse
            {
                Id = e.Id,
                Name = e.Name,
                Category = e.Category,
                Quantity = e.Quantity,
                Description = e.Description,
                Effectiveness = e.Effectiveness,
                DeletedAt = e.DeletedAt,
                AllocatedQuantity = allocated,
                AvailableQuantity = available
            });
        }

        return result;
    }



    public async Task<EquipmentResponse> GetByIdAsync(int id, bool includeDeleted = false)
    {
        var equipment = await _repository.GetByIdAsync(id, includeDeleted)
            ?? throw new KeyNotFoundException("Equipment not found");

        return await ToDtoWithAllocationAsync(equipment);
    }



    // CREATE = add-stock; if exists restore + increment
    public async Task<EquipmentResponse> CreateAsync(CreateEquipmentRequest request)
    {
        var name = NormalizeName(request.Name);
        if (string.IsNullOrWhiteSpace(name))
            throw new ArgumentException("Name is required.");

        var category = NormalizeCategory(request.Category);

        if (request.Quantity < 0)
            throw new ArgumentException("Quantity cannot be negative.");

        var effectiveness = NormalizeEffectiveness(request.Effectiveness);
        var description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim();

        var existing = await _repository.GetByNameAsync(name, includeDeleted: true);

        if (existing != null)
        {
            if (existing.DeletedAt != null)
                existing.DeletedAt = null;

            if (category != null)
                existing.Category = category;

            existing.Quantity += request.Quantity; // request.Quantity je int

            existing.Description = description;
            existing.Effectiveness = effectiveness;

            await _repository.UpdateAsync(existing);
            
            return await ToDtoWithAllocationAsync(existing);
        }

        var equipment = new Equipment
        {
            Name = name,
            Category = category,
            Quantity = request.Quantity,
            Description = description,
            Effectiveness = effectiveness,
            DeletedAt = null
        };

        await _repository.AddAsync(equipment);

        return await ToDtoWithAllocationAsync(equipment);
    }



    // UPDATE = set quantity (optional) + update category (optional)
    public async Task<EquipmentResponse> UpdateAsync(int id, UpdateEquipmentRequest request)
    {
        var equipment = await _repository.GetByIdAsync(id, includeDeleted: true)
            ?? throw new KeyNotFoundException("Equipment not found");

        if (equipment.DeletedAt != null)
            throw new ArgumentException("Cannot update a soft-deleted equipment. Restore via Create.");

        var category = NormalizeCategory(request.Category);
        if (category != null)
            equipment.Category = category;

        if (request.Quantity.HasValue)
        {
            if (request.Quantity.Value < 0)
                throw new ArgumentException("Quantity cannot be negative.");
            equipment.Quantity = request.Quantity.Value;
        }

        if (request.Description != null)
            equipment.Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim();

        if (request.Effectiveness.HasValue)
            equipment.Effectiveness = NormalizeEffectiveness(request.Effectiveness.Value);

        await _repository.UpdateAsync(equipment);
        return await ToDtoWithAllocationAsync(equipment);
    }



    public async Task DeleteAsync(int id)
    {
        var equipment = await _repository.GetByIdAsync(id, includeDeleted: true)
            ?? throw new KeyNotFoundException("Equipment not found");

        if (equipment.DeletedAt == null)
        {
            equipment.DeletedAt = DateTime.UtcNow;
            await _repository.UpdateAsync(equipment);
        }
    }



    private static int NormalizeEffectiveness(int effectiveness)
    {
        if (effectiveness < 1 || effectiveness > 100)
            throw new ArgumentException("Effectiveness must be between 1 and 100.");
        return effectiveness;
    }
}