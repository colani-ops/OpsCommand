using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OpsCommand.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddMissionExecutionFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Difficulty",
                table: "Missions",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "EnemyStrength",
                table: "Missions",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ExecutedAt",
                table: "Missions",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "SuccessChanceSnapshot",
                table: "Missions",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Terrain",
                table: "Missions",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "WasSuccessful",
                table: "Missions",
                type: "boolean",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Difficulty",
                table: "Missions");

            migrationBuilder.DropColumn(
                name: "EnemyStrength",
                table: "Missions");

            migrationBuilder.DropColumn(
                name: "ExecutedAt",
                table: "Missions");

            migrationBuilder.DropColumn(
                name: "SuccessChanceSnapshot",
                table: "Missions");

            migrationBuilder.DropColumn(
                name: "Terrain",
                table: "Missions");

            migrationBuilder.DropColumn(
                name: "WasSuccessful",
                table: "Missions");
        }
    }
}
