using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace OpsCommand.Api.Models.Auth
{

    public class AuthResponse
    {
        public string Token { get; set; } = default!;
        public string Email { get; set; } = default!;
        public string? UserName { get; set; }
        public IList<string> Roles { get; set; } = new List<string>();

        public string Id { get; set; } = default!;
    }
}
