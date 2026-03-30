using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OpsCommand.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddUserEquipmentFoundation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "UserId",
                table: "UserEquipments",
                type: "text",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.AddColumn<int>(
                name: "Quantity",
                table: "UserEquipments",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "IX_UserEquipments_EquipmentId",
                table: "UserEquipments",
                column: "EquipmentId");

            migrationBuilder.AddForeignKey(
                name: "FK_UserEquipments_AspNetUsers_UserId",
                table: "UserEquipments",
                column: "UserId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_UserEquipments_Equipments_EquipmentId",
                table: "UserEquipments",
                column: "EquipmentId",
                principalTable: "Equipments",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_UserEquipments_AspNetUsers_UserId",
                table: "UserEquipments");

            migrationBuilder.DropForeignKey(
                name: "FK_UserEquipments_Equipments_EquipmentId",
                table: "UserEquipments");

            migrationBuilder.DropIndex(
                name: "IX_UserEquipments_EquipmentId",
                table: "UserEquipments");

            migrationBuilder.DropColumn(
                name: "Quantity",
                table: "UserEquipments");

            migrationBuilder.AlterColumn<int>(
                name: "UserId",
                table: "UserEquipments",
                type: "integer",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");
        }
    }
}
