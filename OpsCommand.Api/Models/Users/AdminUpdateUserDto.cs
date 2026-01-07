using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace OpsCommand.Api.Models.Users
{
    public class AdminUpdateUserDto
    {
        public string Role { get; set; } = default!;      // Updated role - "Commander", "Member", "Recruit", "Admin"
        public int? AssignedSquadId { get; set; }         // null = remove from squad
        //public bool isActive { get; set; }                //Is the user soft deleted?
    }
}
