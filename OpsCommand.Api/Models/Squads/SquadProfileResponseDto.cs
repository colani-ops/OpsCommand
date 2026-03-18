using OpsCommand.Api.Models.Squads.Equipment;

namespace OpsCommand.Api.Models.Squads
{
    public class SquadProfileResponseDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = default!;
        public string? Type { get; set; }

        public string? CommanderId { get; set; }
        public string? CommanderName { get; set; }

        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? DeletedAt { get; set; }

        public int MissionsServed { get; set; }
        public int MissionsWon { get; set; }
        public double SuccessRate { get; set; }

        public List<SquadEquipmentResponseDto> Equipment { get; set; } = new();

        public List<SquadMemberDto> Members { get; set; } = new();
    }
}