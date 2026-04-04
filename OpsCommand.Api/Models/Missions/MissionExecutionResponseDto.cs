namespace OpsCommand.Api.Models.Missions
{
    public class MissionExecutionResponseDto
    {
        public int MissionId { get; set; }
        public string MissionName { get; set; } = string.Empty;

        public string Terrain { get; set; } = string.Empty;
        public string Difficulty { get; set; } = string.Empty;
        public string EnemyStrength { get; set; } = string.Empty;

        public int BaseScore { get; set; }
        public int EquipmentScore { get; set; }
        public int ModifierScore { get; set; }

        public int FinalScore { get; set; }
        public int SuccessChance { get; set; }

        public bool WasSuccessful { get; set; }
        public string Outcome { get; set; } = string.Empty;
    }
}