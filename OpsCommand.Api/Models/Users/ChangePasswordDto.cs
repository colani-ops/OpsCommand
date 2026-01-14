using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace OpsCommand.Api.Models.Users
{
    public class ChangePasswordDto
    {
        public string CurrentPassword { get; set; } = default!;
        public string NewPassword { get; set; } = default!;

        //public string ConfirmNewPassword { get; set; } = default!;
    }
}
