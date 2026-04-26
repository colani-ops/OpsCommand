namespace OpsCommand.Api.Models.Squads
{
    public class SquadMemberDto
    {
        public string Id { get; set; } = default!;
        public string Email { get; set; } = default!;
        public string? UserName { get; set; }
        public string Role { get; set; } = default!;
        public bool IsActive { get; set; }
        public string? ProfileImageUrl { get; set; }
    }
}