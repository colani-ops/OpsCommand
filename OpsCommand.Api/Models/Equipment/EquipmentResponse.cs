using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace OpsCommand.Api.Models.Equipment
{
    public class EquipmentResponse
    {
        public int Id { get; set; }
        public string Name { get; set; } = null!;
        public string? Category { get; set; }
        public int Quantity { get; set; }
        public DateTime? DeletedAt { get; set; }
        public string? Description { get; set; }
        public int Effectiveness { get; set; }
    }
}

