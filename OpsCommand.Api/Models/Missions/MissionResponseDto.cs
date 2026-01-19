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
            public string Status { get; set; } = string.Empty; //Planned, inProgress, Completed, Dancelled

            public string CommanderId { get; set; } = string.Empty; //UserId
            public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
            public string CreatedByUserId { get; set; } = string.Empty;
            public string? Notes { get; set; } //Results
    }
}
