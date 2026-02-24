using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace OpsCommand.Api.Models.Equipment
{
    public class UpdateEquipmentRequest
    {
        public string? Category { get; set; }
        public int? Quantity { get; set; } // set semantics
    }
}

