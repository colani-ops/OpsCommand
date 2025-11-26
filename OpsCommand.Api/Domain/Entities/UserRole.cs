using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace OpsCommand.Api.Domain.Entities
{

	public class UserRole
	{

		public int Id { get; set; }
		public string Name { get; set; } = default!; //SuperAdmin, Admin, Commander, Member, Recruit

	}
}