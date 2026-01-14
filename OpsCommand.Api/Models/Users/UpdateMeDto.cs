using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace OpsCommand.Api.Models.Users
{
    public class UpdateMeDto
    {
        public string? UserName { get; set; }
        public string? Email { get; set; }
    }
}
