namespace OpsCommand.Api.Models.Missions
{
    public class MissionReadinessResponseDto
    {
        public int MissionId { get; set; }
        public string MissionName { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;

        public string? CommanderId { get; set; }
        public int? SquadId { get; set; }

        public string Terrain { get; set; } = string.Empty;
        public string Difficulty { get; set; } = string.Empty;

        public int BaseScore { get; set; }
        public int DifficultyModifier { get; set; }
        public int EquipmentScore { get; set; }
        public int FinalScore { get; set; }
        public int ProjectedSuccessChance { get; set; }

        public List<string> RecommendedCategories { get; set; } = new();
        public string ReadinessLabel { get; set; } = string.Empty;
    }
}