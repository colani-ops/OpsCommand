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
    }
}
