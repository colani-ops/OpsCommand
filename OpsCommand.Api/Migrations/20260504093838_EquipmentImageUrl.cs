using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OpsCommand.Api.Migrations
{
    /// <inheritdoc />
    public partial class EquipmentImageUrl : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ImageUrl",
                table: "UserEquipments",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ImageUrl",
                table: "SquadEquipments",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ImageUrl",
                table: "UserEquipments");

            migrationBuilder.DropColumn(
                name: "ImageUrl",
                table: "SquadEquipments");
        }
    }
}
