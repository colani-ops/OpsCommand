using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace OpsCommand.Api.Models.Missions
{
    public class MissionResponseDto
    {
            public int Id { get; set; }
            public string Name { get; set; } = string.Empty;
            public string Status { get; set; } = string.Empty; //Planned, Active, Completed, Cancelled

            public string? CommanderId { get; set; } //UserId
            public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
            public string CreatedByUserId { get; set; } = string.Empty;
            public string? Notes { get; set; } //Results
            public int? SquadId { get; set; }

            public string? Terrain { get; set; }
            public string? Difficulty { get; set; }

            public int? SuccessChanceSnapshot { get; set; }
            public bool? WasSuccessful { get; set; }
            public DateTime? ExecutedAt { get; set; }

            //Pseudo Real-time
            public DateTime? ActivatedAt { get; set; }
            public int? DurationMinutes { get; set; }
    }
}
