using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace OpsCommand.Api.Domain.Entities
{

    public class Squad
    {
        public int Id { get; set; }
        public string Name { get; set; } = default!;
        public string? Type { get; set; }
        public int? CommanderId { get; set; } //UserId - connect to applicationUser
        public bool IsActive { get; set; } = true;
    }
}