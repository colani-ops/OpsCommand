namespace OpsCommand.Api.Models.Squads
{
    public class SquadMemberEquipmentSummaryDto
    {
        public List<string> Primary { get; set; } = new();
        public List<string> Secondary { get; set; } = new();
        public List<string> Melee { get; set; } = new();
        public List<string> Utility { get; set; } = new();
    }
}