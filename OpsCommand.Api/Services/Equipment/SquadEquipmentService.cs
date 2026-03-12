using Microsoft.AspNetCore.Identity;
using OpsCommand.Api.Domain.Entities;
using OpsCommand.Api.Models.Squads.Equipment;
using OpsCommand.Api.Repositories.Equipments;
using OpsCommand.Api.Repositories.SquadEquipments;
using OpsCommand.Api.Repositories.Squads;

namespace OpsCommand.Api.Services.SquadEquipments
{
    public class SquadEquipmentService : ISquadEquipmentService
    {
        private readonly ISquadEquipmentRepository _squadEquipmentRepository;
        private readonly ISquadRepository _squadRepository;
        private readonly IEquipmentRepository _equipmentRepository;
        private readonly UserManager<ApplicationUser> _userManager;

        public SquadEquipmentService(
            ISquadEquipmentRepository squadEquipmentRepository,
            ISquadRepository squadRepository,
            IEquipmentRepository equipmentRepository,
            UserManager<ApplicationUser> userManager)
        {
            _squadEquipmentRepository = squadEquipmentRepository;
            _squadRepository = squadRepository;
            _equipmentRepository = equipmentRepository;
            _userManager = userManager;
        }

        private static SquadEquipmentResponseDto MapToDto(SquadEquipment se) => new()
        {
            SquadId = se.SquadId,
            EquipmentId = se.EquipmentId,
            EquipmentName = se.Equipment.Name,
            Category = se.Equipment.Category,
            Quantity = se.Quantity
        };

        private async Task EnsureAccessAsync(int squadId, string userId, bool isAdmin)
        {
            if (isAdmin) return;

            var user = await _userManager.FindByIdAsync(userId)
                ?? throw new UnauthorizedAccessException("User not found.");

            if (user.AssignedSquadId != squadId)
                throw new UnauthorizedAccessException("You can only manage equipment for your own squad.");
        }

        public async Task<List<SquadEquipmentResponseDto>> GetBySquadIdAsync(int squadId, string userId, bool isAdmin)
        {
            await EnsureAccessAsync(squadId, userId, isAdmin);

            var squad = await _squadRepository.GetByIdAsync(squadId);
            if (squad == null)
                throw new KeyNotFoundException("Squad not found.");

            var items = await _squadEquipmentRepository.GetBySquadIdAsync(squadId);
            return items.Select(MapToDto).ToList();
        }

        public async Task<SquadEquipmentResponseDto> AddAsync(int squadId, AddSquadEquipmentRequest request, string userId, bool isAdmin)
        {
            await EnsureAccessAsync(squadId, userId, isAdmin);

            if (request.Quantity <= 0)
                throw new ArgumentException("Quantity must be greater than 0.");

            var squad = await _squadRepository.GetByIdAsync(squadId);
            if (squad == null)
                throw new KeyNotFoundException("Squad not found.");

            var equipment = await _equipmentRepository.GetByIdAsync(request.EquipmentId, includeDeleted: false);
            if (equipment == null)
                throw new KeyNotFoundException("Equipment not found.");

            var existing = await _squadEquipmentRepository.GetByIdsAsync(squadId, request.EquipmentId);
            if (existing != null)
                throw new ArgumentException("This equipment is already assigned to the squad.");

            var entity = new SquadEquipment
            {
                SquadId = squadId,
                EquipmentId = request.EquipmentId,
                Quantity = request.Quantity
            };

            await _squadEquipmentRepository.AddAsync(entity);

            var created = await _squadEquipmentRepository.GetByIdsAsync(squadId, request.EquipmentId)
                ?? throw new Exception("Failed to load created squad equipment.");

            return MapToDto(created);
        }

        public async Task<SquadEquipmentResponseDto> UpdateAsync(int squadId, int equipmentId, UpdateSquadEquipmentRequest request, string userId, bool isAdmin)
        {
            await EnsureAccessAsync(squadId, userId, isAdmin);

            if (request.Quantity <= 0)
                throw new ArgumentException("Quantity must be greater than 0.");

            var existing = await _squadEquipmentRepository.GetByIdsAsync(squadId, equipmentId)
                ?? throw new KeyNotFoundException("Squad equipment entry not found.");

            existing.Quantity = request.Quantity;
            await _squadEquipmentRepository.UpdateAsync(existing);

            return MapToDto(existing);
        }

        public async Task DeleteAsync(int squadId, int equipmentId, string userId, bool isAdmin)
        {
            await EnsureAccessAsync(squadId, userId, isAdmin);

            var existing = await _squadEquipmentRepository.GetByIdsAsync(squadId, equipmentId)
                ?? throw new KeyNotFoundException("Squad equipment entry not found.");

            await _squadEquipmentRepository.DeleteAsync(existing);
        }
    }
}