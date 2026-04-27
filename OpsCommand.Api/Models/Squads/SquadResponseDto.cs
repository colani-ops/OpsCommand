using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace OpsCommand.Api.Models.Squads
{
    public class SquadResponseDto
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string? Type { get; set; }
        public string? CommanderId { get; set; } //UserId - connect to applicationUser
        public bool IsActive { get; set; } = true;

        public string? BannerImageUrl { get; set; }

        //public bool IsDeployed { get; set; } = false;

        public DateTime CreatedAt { get; set; }
        public DateTime? DeletedAt { get; set; }
        public int MissionsServed { get; set; }
        public int MissionsWon { get; set; }
    }
}
