using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace OpsCommand.Api.Domain.Entities
{
    public class Equipment
    {
        public int Id { get; set; }

        public string Name { get; set; } = null!;

        //(filtriranje u UI)
        public string? Category { get; set; }

        public DateTime? DeletedAt { get; set; }

        //Navigation
        public ICollection<SquadEquipment> SquadEquipments { get; set; } = new List<SquadEquipment>();
    }
}

