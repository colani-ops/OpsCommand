using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace OpsCommand.Api.Models.Squads
{
    public class SquadUpdateDto
    {
        public string? Name { get; set; }
        public string? Type { get; set; }
        public string? CommanderId { get; set; }
        public bool ClearCommander { get; set; } = false;
    }
}
