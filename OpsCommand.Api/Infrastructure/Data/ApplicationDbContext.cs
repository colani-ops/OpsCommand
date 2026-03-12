using Microsoft.EntityFrameworkCore;
using OpsCommand.Api.Domain.Entities;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;

namespace OpsCommand.Api.Infrastructure.Data
{
	public class ApplicationDbContext : IdentityDbContext<ApplicationUser>
	{

		public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)

			: base(options)

		{
		}

		//public DbSet<UserRole> UserRoles { get; set; } //Using built-in AspNetRoles!
		public DbSet<Squad> Squads { get; set; }
		public DbSet<Mission> Missions { get; set; }
		public DbSet<Equipment> Equipments { get; set; }
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

            // Equipment config
            modelBuilder.Entity<Equipment>(entity =>
            {
                entity.ToTable("Equipments");

                entity.Property(e => e.Name)
                    .IsRequired()
                    .HasMaxLength(100);

                entity.Property(e => e.Category)
                    .HasMaxLength(50);

                entity.Property(e => e.Description)
                    .HasMaxLength(1000);

                entity.Property(e => e.Effectiveness)
                    .IsRequired();

                entity.HasIndex(e => e.Name).IsUnique();
            });

            //SquadEquipment relationships
            modelBuilder.Entity<SquadEquipment>(entity =>
            {
                entity.ToTable("SquadEquipments");

                entity.Property(se => se.Quantity)
                    .IsRequired();

                entity.HasOne(se => se.Squad)
                    .WithMany(s => s.SquadEquipments) //navigation u Squad entitetu
                    .HasForeignKey(se => se.SquadId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(se => se.Equipment)
                    .WithMany(e => e.SquadEquipments)
                    .HasForeignKey(se => se.EquipmentId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

        }
    }
}