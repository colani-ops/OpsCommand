namespace OpsCommand.Api.Models.Squads
{
    public class MySquadResponseDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = default!;
        public string Type { get; set; } = default!;

        public string? CommanderId { get; set; }
        public string? CommanderName { get; set; }

        public int MissionsServed { get; set; }
        public int MissionsWon { get; set; }

        public double SuccessRate { get; set; }

        public List<SquadMemberDto> Members { get; set; } = new();
    }
}