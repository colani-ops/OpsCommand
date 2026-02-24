using OpsCommand.Api.Domain.Entities;
using OpsCommand.Api.Models.Equipment;
using OpsCommand.Api.Repositories.Equipments;
using OpsCommand.Api.Services.Equipments;

public class EquipmentService : IEquipmentService
{
    private readonly IEquipmentRepository _repository;

    private static readonly HashSet<string> AllowedCategories =
        new(StringComparer.OrdinalIgnoreCase) { "Primary", "Secondary", "Melee", "Utility" };

    public EquipmentService(IEquipmentRepository repository)
    {
        _repository = repository;
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

    private static EquipmentResponse ToDto(Equipment e) => new()
    {
        Id = e.Id,
        Name = e.Name,
        Category = e.Category,
        Quantity = e.Quantity,
        DeletedAt = e.DeletedAt
    };

    public async Task<List<EquipmentResponse>> GetAllAsync(bool includeDeleted = false)
    {
        var items = await _repository.GetAllAsync(includeDeleted);
        return items.Select(ToDto).ToList();
    }

    public async Task<EquipmentResponse> GetByIdAsync(int id, bool includeDeleted = false)
    {
        var e = await _repository.GetByIdAsync(id, includeDeleted)
            ?? throw new KeyNotFoundException("Equipment not found");
        return ToDto(e);
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

        var existing = await _repository.GetByNameAsync(name, includeDeleted: true);

        if (existing != null)
        {
            if (existing.DeletedAt != null)
                existing.DeletedAt = null;

            if (category != null)
                existing.Category = category;

            existing.Quantity += request.Quantity; // request.Quantity je int => nema CS0266

            await _repository.UpdateAsync(existing);
            return ToDto(existing);
        }

        var equipment = new Equipment
        {
            Name = name,
            Category = category,
            Quantity = request.Quantity,
            DeletedAt = null
        };

        await _repository.AddAsync(equipment);
        return ToDto(equipment);
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

        await _repository.UpdateAsync(equipment);
        return ToDto(equipment);
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
}