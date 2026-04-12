using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OpsCommand.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddMissionActivationTiming : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "ActivatedAt",
                table: "Missions",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "DurationMinutes",
                table: "Missions",
                type: "integer",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ActivatedAt",
                table: "Missions");

            migrationBuilder.DropColumn(
                name: "DurationMinutes",
                table: "Missions");
        }
    }
}
