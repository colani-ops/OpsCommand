
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
            public string Name { get; set; } = string.Empty;
            public string Status { get; set; } = string.Empty; 
            //Change to enum later?
            //Planned, Active, Completed, Cancelled

            public string? CommanderId { get; set; } //UserId
            public int? SquadId { get; set; }

            public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
            public DateTime? DeletedAt { get; set; }
            public string CreatedByUserId { get; set; } = string.Empty;
            public string? Notes { get; set; } //Results

            public string? Terrain { get; set; }          // Urban, Plains, Forest, Mountain
            public string? Difficulty { get; set; }       // Low, Medium, High

            public int? SuccessChanceSnapshot { get; set; }
            public bool? WasSuccessful { get; set; }
            public DateTime? ExecutedAt { get; set; }
        }
    }