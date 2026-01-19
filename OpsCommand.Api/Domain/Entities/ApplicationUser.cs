using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

using Microsoft.AspNetCore.Identity;

namespace OpsCommand.Api.Domain.Entities
{
    public class ApplicationUser : IdentityUser
    {
        //public int UserRoleId { get; set; } // FK UserRole
        public int? AssignedSquadId { get; set; } // FK Squad (nullable)

        //DisabledAt ??
    }
}
