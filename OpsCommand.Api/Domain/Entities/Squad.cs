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
        public string? CommanderId { get; set; } //UserId - connect to applicationUser
        
        //public bool IsDeployed { get; set; } = false;
        public DateTime CreatedAt { get; set; }
        public DateTime? DeletedAt { get; set; }
        public int MissionsServed { get; set; }
        public int MissionsWon { get; set; }
    }
}