using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace OpsCommand.Api.Models.Squads
{
    public class SquadCreateDto
    {
        public string Name { get; set; } = default!;
        public string Type { get; set; } = default!;
        public string? CommanderId { get; set; } //Za pocetak null
    }
}
