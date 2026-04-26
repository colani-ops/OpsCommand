using System;
using System.Collections.Generic;

namespace OpsCommand.Api.Domain.Entities
{
    public class Squad
    {
        public int Id { get; set; }
        public string Name { get; set; } = default!;
        public string? Type { get; set; }
        public string? CommanderId { get; set; }

        public string? BannerImageUrl { get; set; }

        public DateTime CreatedAt { get; set; }
        public DateTime? DeletedAt { get; set; }
        public int MissionsServed { get; set; }
        public int MissionsWon { get; set; }

        public ICollection<SquadEquipment> SquadEquipments { get; set; } = new List<SquadEquipment>();
    }
}