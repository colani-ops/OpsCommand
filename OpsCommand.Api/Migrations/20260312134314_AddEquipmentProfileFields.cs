using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OpsCommand.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddEquipmentProfileFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Description",
                table: "Equipments",
                type: "character varying(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Effectiveness",
                table: "Equipments",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Description",
                table: "Equipments");

            migrationBuilder.DropColumn(
                name: "Effectiveness",
                table: "Equipments");
        }
    }
}
