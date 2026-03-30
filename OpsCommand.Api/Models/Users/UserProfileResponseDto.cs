namespace OpsCommand.Api.Models.Users
{
    public class UserProfileResponseDto
    {
        public string Id { get; set; } = default!;
        public string Email { get; set; } = default!;
        public string? UserName { get; set; }
        public int? AssignedSquadId { get; set; }
        public string? PrimaryRole { get; set; }
        public bool IsActive { get; set; }
    }
}