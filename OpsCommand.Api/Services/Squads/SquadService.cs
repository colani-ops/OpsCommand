using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using OpsCommand.Api.Domain.Entities;
using OpsCommand.Api.Infrastructure.Data;
using OpsCommand.Api.Models.SquadEquipment;
using OpsCommand.Api.Models.Squads;
using OpsCommand.Api.Repositories.Missions;
using OpsCommand.Api.Repositories.SquadEquipments;
using OpsCommand.Api.Repositories.Squads;
using Microsoft.AspNetCore.Http;
using System.IO;

namespace OpsCommand.Api.Services.Squads
{
    public class SquadService : ISquadService
    {
        private readonly ISquadRepository _squadRepository;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly IMissionRepository _missionRepository;
        private readonly ISquadEquipmentRepository _squadEquipmentRepository;
        private readonly ApplicationDbContext _context;

        public SquadService(
            ISquadRepository squadRepository,
            UserManager<ApplicationUser> userManager,
            IMissionRepository missionRepository,
            ISquadEquipmentRepository squadEquipmentRepository,
            ApplicationDbContext context)
        {
            _squadRepository = squadRepository;
            _userManager = userManager;
            _missionRepository = missionRepository;
            _squadEquipmentRepository = squadEquipmentRepository;
            _context = context;
        }

        private static readonly string[] AllowedTypes =
        [
            "Assault",
            "Tactical",
            "Recon"
        ];

        private static SquadResponseDto MapToSquadDto(Squad squad)
        {
            return new SquadResponseDto
            {
                Id = squad.Id,
                Name = squad.Name,
                Type = squad.Type,
                CommanderId = squad.CommanderId,
                IsActive = squad.DeletedAt == null,
                BannerImageUrl = squad.BannerImageUrl,
                CreatedAt = squad.CreatedAt,
                DeletedAt = squad.DeletedAt,
                MissionsServed = squad.MissionsServed,
                MissionsWon = squad.MissionsWon
            };
        }

        private static readonly string[] AllowedImageExtensions = [".jpg", ".jpeg", ".png", ".webp"];

        private static void ValidateImageFile(IFormFile file)
        {
            var ext = Path.GetExtension(file.FileName).ToLowerInvariant();

            if (!AllowedImageExtensions.Contains(ext))
                throw new ArgumentException("Allowed image formats: .jpg, .jpeg, .png, .webp");

            if (file.Length > 5 * 1024 * 1024)
                throw new ArgumentException("Image is too large. Maximum size is 5 MB.");
        }

        private static string EnsureUploadsRoot()
        {
            var uploadsRoot = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "squads");
            Directory.CreateDirectory(uploadsRoot);
            return uploadsRoot;
        }

        private static string BuildPublicBannerPath(string fileName)
        {
            return $"/uploads/squads/{fileName}";
        }

        private async Task<string?> GetCommanderDisplayNameAsync(string? commanderId)
        {
            if (string.IsNullOrWhiteSpace(commanderId))
                return null;

            var commander = await _userManager.FindByIdAsync(commanderId);
            if (commander == null)
                return null;

            return $"{commander.UserName} ({commander.Email})";
        }

        private async Task<SquadMemberEquipmentSummaryDto> GetEquipmentSummaryForUserAsync(string userId)
        {
            var userEquipment = await _context.UserEquipments
                .Include(ue => ue.Equipment)
                .Where(ue => ue.UserId == userId)
                .Where(ue => ue.Equipment.DeletedAt == null)
                .ToListAsync();

            var summary = new SquadMemberEquipmentSummaryDto();

            foreach (var ue in userEquipment)
            {
                var label = $"{ue.Equipment.Name} x{ue.Quantity}";

                switch (ue.Equipment.Category)
                {
                    case "Primary":
                        summary.Primary.Add(label);
                        break;
                    case "Secondary":
                        summary.Secondary.Add(label);
                        break;
                    case "Melee":
                        summary.Melee.Add(label);
                        break;
                    case "Utility":
                        summary.Utility.Add(label);
                        break;
                }
            }

            return summary;
        }

        private async Task<SquadMemberDto> MapToSquadMemberDtoAsync(ApplicationUser user)
        {
            var roles = await _userManager.GetRolesAsync(user);
            var primaryRole = roles.FirstOrDefault() ?? "Unknown";

            return new SquadMemberDto
            {
                Id = user.Id,
                Email = user.Email ?? string.Empty,
                UserName = user.UserName,
                Role = primaryRole,
                IsActive = !await _userManager.IsLockedOutAsync(user),
                ProfileImageUrl = user.ProfileImageUrl,
                EquipmentSummary = await GetEquipmentSummaryForUserAsync(user.Id)
            };
        }

        private static double CalculateSuccessRate(Squad squad)
        {
            if (squad.MissionsServed <= 0)
                return 0;

            return Math.Round((double)squad.MissionsWon / squad.MissionsServed * 100, 2);
        }

        public async Task<IEnumerable<SquadResponseDto>> GetAllAsync()
        {
            var squads = await _squadRepository.GetAllAsync();
            return squads.Select(MapToSquadDto).ToList();
        }

        public async Task<SquadResponseDto?> GetByIdAsync(int id)
        {
            var squad = await _squadRepository.GetByIdAsync(id);
            return squad == null ? null : MapToSquadDto(squad);
        }

        public async Task<SquadProfileResponseDto?> GetProfileByIdAsync(int id)
        {
            var squad = await _squadRepository.GetByIdAsync(id);
            if (squad == null)
                return null;

            var commanderName = await GetCommanderDisplayNameAsync(squad.CommanderId);

            var equipment = await _squadEquipmentRepository.GetBySquadIdAsync(id);
            var equipmentDtos = equipment.Select(se => new SquadEquipmentResponseDto
            {
                SquadId = se.SquadId,
                EquipmentId = se.EquipmentId,
                EquipmentName = se.Equipment.Name,
                Category = se.Equipment.Category,
                Quantity = se.Quantity,
                ImageUrl = se.Equipment.ImageUrl
            }).ToList();

            var squadUsers = await _userManager.Users
                .Where(u => u.AssignedSquadId == id)
                .ToListAsync();

            var memberDtos = new List<SquadMemberDto>();
            foreach (var user in squadUsers)
            {
                memberDtos.Add(await MapToSquadMemberDtoAsync(user));
            }

            return new SquadProfileResponseDto
            {
                Id = squad.Id,
                Name = squad.Name,
                Type = squad.Type,
                CommanderId = squad.CommanderId,
                CommanderName = commanderName,
                IsActive = squad.DeletedAt == null,
                CreatedAt = squad.CreatedAt,
                DeletedAt = squad.DeletedAt,
                MissionsServed = squad.MissionsServed,
                MissionsWon = squad.MissionsWon,
                SuccessRate = CalculateSuccessRate(squad),
                BannerImageUrl = squad.BannerImageUrl,
                Equipment = equipmentDtos,
                Members = memberDtos
            };
        }

        public async Task<MySquadResponseDto?> GetMySquadAsync(string userId)
        {
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null || user.AssignedSquadId == null)
                return null;

            var squad = await _squadRepository.GetByIdAsync(user.AssignedSquadId.Value);
            if (squad == null)
                return null;

            var squadUsers = await _userManager.Users
                .Where(u => u.AssignedSquadId == squad.Id)
                .ToListAsync();

            var memberDtos = new List<SquadMemberDto>();
            foreach (var memberUser in squadUsers)
            {
                memberDtos.Add(await MapToSquadMemberDtoAsync(memberUser));
            }

            memberDtos = memberDtos
                .GroupBy(m => m.Id)
                .Select(g => g.First())
                .ToList();

            var commanderName = await GetCommanderDisplayNameAsync(squad.CommanderId);

            return new MySquadResponseDto
            {
                Id = squad.Id,
                Name = squad.Name,
                Type = squad.Type ?? "Unknown",
                CommanderId = squad.CommanderId,
                CommanderName = commanderName,
                MissionsServed = squad.MissionsServed,
                MissionsWon = squad.MissionsWon,
                SuccessRate = CalculateSuccessRate(squad),
                BannerImageUrl = squad.BannerImageUrl,
                Members = memberDtos
            };
        }

        public async Task<SquadResponseDto> CreateAsync(SquadCreateDto dto)
        {
            if (!string.IsNullOrWhiteSpace(dto.CommanderId))
            {
                var commander = await _userManager.FindByIdAsync(dto.CommanderId);

                if (commander == null)
                    throw new ArgumentException("Commander user not found.");

                var isCommander = await _userManager.IsInRoleAsync(commander, "Commander");
                if (!isCommander)
                    throw new ArgumentException("User is not eligible to be a commander.");

                var existing = await _squadRepository.GetActiveSquadByCommanderIdAsync(dto.CommanderId);
                if (existing != null)
                    throw new ArgumentException($"Commander is already assigned to squad '{existing.Name}' (Id {existing.Id}).");

                if (await _userManager.IsLockedOutAsync(commander))
                    throw new ArgumentException("Commander is inactive");
            }

            if (!AllowedTypes.Contains(dto.Type))
                throw new ArgumentException("Invalid squad type. Allowed: Assault, Tactical, Recon");

            var squad = new Squad
            {
                Name = dto.Name,
                Type = dto.Type,
                CommanderId = dto.CommanderId,
                CreatedAt = DateTime.UtcNow,
                MissionsServed = 0,
                MissionsWon = 0
            };

            await _squadRepository.AddAsync(squad);

            if (!string.IsNullOrWhiteSpace(dto.CommanderId))
            {
                var commander = await _userManager.FindByIdAsync(dto.CommanderId);
                if (commander == null)
                    throw new ArgumentException("Commander user not found after squad creation.");

                commander.AssignedSquadId = squad.Id;

                var updateCommanderRes = await _userManager.UpdateAsync(commander);
                if (!updateCommanderRes.Succeeded)
                    throw new ArgumentException(string.Join("; ", updateCommanderRes.Errors.Select(e => e.Description)));
            }

            return MapToSquadDto(squad);
        }

        public async Task<SquadResponseDto?> UpdateAsync(int id, SquadUpdateDto dto)
        {
            var squad = await _squadRepository.GetByIdAsync(id);
            if (squad == null)
                return null;

            var oldCommanderId = squad.CommanderId;

            if (!string.IsNullOrWhiteSpace(dto.Name))
                squad.Name = dto.Name;

            if (!string.IsNullOrWhiteSpace(dto.Type))
            {
                if (!AllowedTypes.Contains(dto.Type))
                    throw new ArgumentException("Invalid squad type. Allowed: Assault, Tactical, Recon");

                squad.Type = dto.Type;
            }

            var commanderId = string.IsNullOrWhiteSpace(dto.CommanderId) ? null : dto.CommanderId;

            if (oldCommanderId != null && oldCommanderId != commanderId)
            {
                var hasOpenMissions = await _missionRepository
                    .HasOpenMissionsForCommanderInSquadAsync(oldCommanderId, squad.Id);

                if (hasOpenMissions)
                    throw new ArgumentException("Cannot change or remove squad commander while they have open missions for this squad.");
            }

            if (oldCommanderId != null && oldCommanderId != commanderId)
            {
                var oldCommander = await _userManager.FindByIdAsync(oldCommanderId);
                if (oldCommander != null && oldCommander.AssignedSquadId == squad.Id)
                {
                    oldCommander.AssignedSquadId = null;
                    var oldUpdateRes = await _userManager.UpdateAsync(oldCommander);
                    if (!oldUpdateRes.Succeeded)
                        throw new ArgumentException(string.Join("; ", oldUpdateRes.Errors.Select(e => e.Description)));
                }
            }

            if (commanderId == null)
            {
                squad.CommanderId = null;
            }
            else
            {
                var commanderUser = await _userManager.FindByIdAsync(commanderId);
                if (commanderUser == null)
                    throw new ArgumentException("Commander user not found.");

                var isCommander = await _userManager.IsInRoleAsync(commanderUser, "Commander");
                if (!isCommander)
                    throw new ArgumentException("User is not eligible to be a commander.");

                if (await _userManager.IsLockedOutAsync(commanderUser))
                    throw new ArgumentException("Commander is inactive.");

                var existingSquads = await _squadRepository.GetAllActiveSquadsByCommanderIdAsync(commanderId);

                foreach (var existingSquad in existingSquads)
                {
                    if (existingSquad.Id != id)
                    {
                        existingSquad.CommanderId = null;
                        await _squadRepository.UpdateAsync(existingSquad);
                    }
                }

                squad.CommanderId = commanderId;

                if (commanderUser.AssignedSquadId != squad.Id)
                {
                    commanderUser.AssignedSquadId = squad.Id;
                    var commanderUpdateRes = await _userManager.UpdateAsync(commanderUser);
                    if (!commanderUpdateRes.Succeeded)
                        throw new ArgumentException(string.Join("; ", commanderUpdateRes.Errors.Select(e => e.Description)));
                }
            }

            await _squadRepository.UpdateAsync(squad);

            return MapToSquadDto(squad);
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var squad = await _squadRepository.GetByIdAsync(id);
            if (squad == null)
                return false;

            if (!string.IsNullOrWhiteSpace(squad.CommanderId))
            {
                var hasOpenMissions = await _missionRepository.HasOpenMissionsForCommanderInSquadAsync(squad.CommanderId, squad.Id);

                if (hasOpenMissions)
                    throw new ArgumentException("Cannot delete squad while it has open missions.");

                var commander = await _userManager.FindByIdAsync(squad.CommanderId);
                if (commander != null && commander.AssignedSquadId == squad.Id)
                {
                    commander.AssignedSquadId = null;
                    var updateRes = await _userManager.UpdateAsync(commander);
                    if (!updateRes.Succeeded)
                        throw new ArgumentException(string.Join("; ", updateRes.Errors.Select(e => e.Description)));
                }
            }

            await _squadRepository.DeleteAsync(squad);
            return true;
        }

        public async Task<SquadResponseDto?> UploadBannerAsync(int id, IFormFile file)
        {
            var squad = await _squadRepository.GetByIdAsync(id);
            if (squad == null)
                return null;

            ValidateImageFile(file);

            var uploadsRoot = EnsureUploadsRoot();
            var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
            var fileName = $"squad_{id}_{Guid.NewGuid():N}{ext}";
            var fullPath = Path.Combine(uploadsRoot, fileName);

            await using (var stream = new FileStream(fullPath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            if (!string.IsNullOrWhiteSpace(squad.BannerImageUrl))
            {
                var oldRelative = squad.BannerImageUrl.TrimStart('/').Replace("/", Path.DirectorySeparatorChar.ToString());
                var oldFullPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", oldRelative);

                if (File.Exists(oldFullPath))
                {
                    File.Delete(oldFullPath);
                }
            }

            squad.BannerImageUrl = BuildPublicBannerPath(fileName);
            await _squadRepository.UpdateAsync(squad);

            return MapToSquadDto(squad);
        }

        public async Task<SquadResponseDto?> RemoveBannerAsync(int id)
        {
            var squad = await _squadRepository.GetByIdAsync(id);
            if (squad == null)
                return null;

            if (!string.IsNullOrWhiteSpace(squad.BannerImageUrl))
            {
                var oldRelative = squad.BannerImageUrl.TrimStart('/').Replace("/", Path.DirectorySeparatorChar.ToString());
                var oldFullPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", oldRelative);

                if (File.Exists(oldFullPath))
                {
                    File.Delete(oldFullPath);
                }
            }

            squad.BannerImageUrl = null;
            await _squadRepository.UpdateAsync(squad);

            return MapToSquadDto(squad);
        }
    }
}