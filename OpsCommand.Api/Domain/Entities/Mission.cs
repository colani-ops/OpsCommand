
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace OpsCommand.Api.Domain.Entities
{


        public class Mission
        {
            public int Id { get; set; }
            public string Name { get; set; }
            public int Status { get; set; } //enum MissionStatus
            public int? CommanderId { get; set; } //UserId
            public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
            public int? CreatedByUserId { get; set; }
            public string? Result { get; set; }
        }
    }