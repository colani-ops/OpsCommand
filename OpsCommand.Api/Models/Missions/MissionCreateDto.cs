using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace OpsCommand.Api.Models.Missions
{
    public class MissionCreateDto
    {
        public string Name { get; set; } = string.Empty;
        public string? CommanderId { get; set; }
        public string? Notes { get; set; }
        public string? Terrain { get; set; }
        public string? Difficulty { get; set; }
    }
}
