using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace OpsCommand.Api.Domain.Entities
{

    public class MissionSquad
    {
        public int MissionId { get; set; }
        //public Mission Mission { get; set; }
        public int SquadId { get; set; }
        //public Squad Squad { get; set; }

    }

    public class SquadEquipment
    {
        public int SquadId { get; set; }
        public Squad Squad { get; set; } = null!;

        public int EquipmentId { get; set; }
        public Equipment Equipment { get; set; } = null!;

        public int Quantity { get; set; }
    }


    public class UserEquipment
    {
        public int UserId { get; set; }
        public int EquipmentId { get; set; }
    }
}