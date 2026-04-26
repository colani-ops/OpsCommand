using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace OpsCommand.Api.Models.Users
{
    public class UserResponseDto
    {
        public string Id { get; set; } = default!;
        public string Email { get; set; } = default!;
        public string? UserName { get; set; }
        public int? AssignedSquadId { get; set; }
        public IList<string> Roles { get; set; } = new List<string>();
        public bool IsActive { get; set; }
        public string? ProfileImageUrl { get; set; }
    }
}