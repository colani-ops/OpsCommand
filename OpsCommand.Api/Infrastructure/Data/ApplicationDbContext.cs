using Microsoft.EntityFrameworkCore;
using OpsCommand.Api.Domain.Entities;


namespace OpsCommand.Api.Infrastructure.Data
{
	public class ApplicationDbContext : DbContext
	{

		public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)

			: base(options)

		{
		}

		public DbSet<UserRole> UserRoles { get; set; }
		public DbSet<Squad> Squads { get; set; }
		public DbSet<Mission> Missions { get; set; }
		//public DbSet<Equipment> Equipment { get; set; }
		public DbSet<MissionSquad> MissionSquads { get; set; }
		public DbSet<SquadEquipment> SquadEquipments { get; set; }
		public DbSet<UserEquipment> UserEquipments { get; set; }

        //OnModelCreating - Later

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<MissionSquad>()
                .HasKey(ms => new { ms.MissionId, ms.SquadId });

            modelBuilder.Entity<SquadEquipment>()
                .HasKey(se => new { se.SquadId, se.EquipmentId });

            modelBuilder.Entity<UserEquipment>()
                .HasKey(ue => new { ue.UserId, ue.EquipmentId });
        }


    }
}