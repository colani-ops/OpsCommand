namespace OpsCommand.Api.Models.Users
{
    public class UserProfileEquipmentSummaryDto
    {
        public List<string> Primary { get; set; } = new();
        public List<string> Secondary { get; set; } = new();
        public List<string> Melee { get; set; } = new();
        public List<string> Utility { get; set; } = new();
    }

    public class UserProfileResponseDto
    {
        public string Id { get; set; } = default!;
        public string Email { get; set; } = default!;
        public string? UserName { get; set; }
        public int? AssignedSquadId { get; set; }
        public string? PrimaryRole { get; set; }
        public bool IsActive { get; set; }
        public string? ProfileImageUrl { get; set; }

        public UserProfileEquipmentSummaryDto EquipmentSummary { get; set; } = new();
    }
}