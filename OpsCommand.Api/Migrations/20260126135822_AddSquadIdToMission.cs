using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OpsCommand.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddSquadIdToMission : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "SquadId",
                table: "Missions",
                type: "int",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "SquadId",
                table: "Missions");
        }
    }
}
