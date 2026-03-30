using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using OpsCommand.Api.Domain.Entities;
using OpsCommand.Api.Infrastructure.Data;
using OpsCommand.Api.Models.UserEquipment;
using OpsCommand.Api.Repositories.UserEquipments;

namespace OpsCommand.Api.Services.UserEquipments
{
    public class UserEquipmentService : IUserEquipmentService
    {
        private readonly IUserEquipmentRepository _userEquipmentRepository;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly ApplicationDbContext _context;

        public UserEquipmentService(
            IUserEquipmentRepository userEquipmentRepository,
            UserManager<ApplicationUser> userManager,
            ApplicationDbContext context)
        {
            _userEquipmentRepository = userEquipmentRepository;
            _userManager = userManager;
            _context = context;
        }

        private static UserEquipmentResponseDto Map(UserEquipment ue) => new()
        {
            EquipmentId = ue.EquipmentId,
            EquipmentName = ue.Equipment.Name,
            Category = ue.Equipment.Category,
            Quantity = ue.Quantity
        };

        public async Task<List<UserEquipmentResponseDto>> GetAvailableForMeAsync(string userId)
        {
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null || user.AssignedSquadId == null)
                return new List<UserEquipmentResponseDto>();

            var squadEquipment = await _context.SquadEquipments
                .Include(se => se.Equipment)
                .Where(se => se.SquadId == user.AssignedSquadId.Value)
                .ToListAsync();

            return squadEquipment.Select(se => new UserEquipmentResponseDto
            {
                EquipmentId = se.EquipmentId,
                EquipmentName = se.Equipment.Name,
                Category = se.Equipment.Category,
                Quantity = se.Quantity
            }).ToList();
        }

        public async Task<List<UserEquipmentResponseDto>> GetMineAsync(string userId)
        {
            var items = await _userEquipmentRepository.GetByUserIdAsync(userId);
            return items.Select(Map).ToList();
        }

        public async Task<UserEquipmentResponseDto> AddToMeAsync(string userId, AddUserEquipmentRequest request)
        {
            if (request.Quantity < 1)
                throw new ArgumentException("Quantity must be at least 1.");

            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
                throw new ArgumentException("User not found.");

            if (user.AssignedSquadId == null)
                throw new ArgumentException("User is not assigned to a squad.");

            var squadEquipment = await _context.SquadEquipments
                .Include(se => se.Equipment)
                .FirstOrDefaultAsync(se =>
                    se.SquadId == user.AssignedSquadId.Value &&
                    se.EquipmentId == request.EquipmentId);

            if (squadEquipment == null)
                throw new ArgumentException("This equipment is not available to your squad.");

            if (request.Quantity > squadEquipment.Quantity)
                throw new ArgumentException("Requested quantity exceeds squad availability.");

            var existing = await _userEquipmentRepository.GetByIdAsync(userId, request.EquipmentId);

            if (existing != null)
            {
                await ValidateCategoryLimitAsync(
                    userId,
                    request.EquipmentId,
                    request.Quantity,
                    excludeEquipmentId: request.EquipmentId);

                existing.Quantity = request.Quantity;
                await _userEquipmentRepository.UpdateAsync(existing);
                return Map(existing);
            }

            await ValidateCategoryLimitAsync(
                userId,
                request.EquipmentId,
                request.Quantity);

            var userEquipment = new UserEquipment
            {
                UserId = userId,
                EquipmentId = request.EquipmentId,
                Quantity = request.Quantity
            };

            await _userEquipmentRepository.AddAsync(userEquipment);

            var created = await _userEquipmentRepository.GetByIdAsync(userId, request.EquipmentId)
                ?? throw new ArgumentException("Failed to load created equipment.");

            return Map(created);
        }

        public async Task<UserEquipmentResponseDto> UpdateMineAsync(string userId, int equipmentId, UpdateUserEquipmentRequest request)
        {
            if (request.Quantity < 1)
                throw new ArgumentException("Quantity must be at least 1.");

            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
                throw new ArgumentException("User not found.");

            if (user.AssignedSquadId == null)
                throw new ArgumentException("User is not assigned to a squad.");

            var squadEquipment = await _context.SquadEquipments
                .Include(se => se.Equipment)
                .FirstOrDefaultAsync(se =>
                    se.SquadId == user.AssignedSquadId.Value &&
                    se.EquipmentId == equipmentId);

            if (squadEquipment == null)
                throw new ArgumentException("This equipment is not available to your squad.");

            if (request.Quantity > squadEquipment.Quantity)
                throw new ArgumentException("Requested quantity exceeds squad availability.");

            var existing = await _userEquipmentRepository.GetByIdAsync(userId, equipmentId);
            if (existing == null)
                throw new ArgumentException("User equipment entry not found.");

            await ValidateCategoryLimitAsync(
                userId,
                equipmentId,
                request.Quantity,
                excludeEquipmentId: equipmentId);

            existing.Quantity = request.Quantity;
            await _userEquipmentRepository.UpdateAsync(existing);

            return Map(existing);
        }

        public async Task<bool> DeleteMineAsync(string userId, int equipmentId)
        {
            var existing = await _userEquipmentRepository.GetByIdAsync(userId, equipmentId);
            if (existing == null)
                return false;

            await _userEquipmentRepository.DeleteAsync(existing);
            return true;
        }

        private const int MaxPerCategory = 2;

        private async Task ValidateCategoryLimitAsync(
            string userId,
            int equipmentId,
            int requestedQuantity,
            int? excludeEquipmentId = null)
        {
            var targetEquipment = await _context.Equipments
                .FirstOrDefaultAsync(e => e.Id == equipmentId && e.DeletedAt == null);

            if (targetEquipment == null)
                throw new ArgumentException("Equipment not found.");

            var targetCategory = targetEquipment.Category;
            if (string.IsNullOrWhiteSpace(targetCategory))
                throw new ArgumentException("Equipment category is required.");

            var userEquipments = await _context.UserEquipments
                .Include(ue => ue.Equipment)
                .Where(ue => ue.UserId == userId)
                .ToListAsync();

            var sameCategoryItems = userEquipments
                .Where(ue => ue.Equipment.Category == targetCategory);

            if (excludeEquipmentId.HasValue)
            {
                sameCategoryItems = sameCategoryItems
                    .Where(ue => ue.EquipmentId != excludeEquipmentId.Value);
            }

            var currentCategoryTotal = sameCategoryItems.Sum(ue => ue.Quantity);
            var newCategoryTotal = currentCategoryTotal + requestedQuantity;

            if (newCategoryTotal > MaxPerCategory)
                throw new ArgumentException(
                    $"Category limit exceeded. You can equip at most {MaxPerCategory} items from category '{targetCategory}'.");
        }
    }
}