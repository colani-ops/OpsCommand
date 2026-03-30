namespace OpsCommand.Api.Models.SquadEquipment
{
    public class SquadEquipmentResponseDto
    {
        public int SquadId { get; set; }
        public int EquipmentId { get; set; }

        public string EquipmentName { get; set; } = default!;
        public string? Category { get; set; }

        public int Quantity { get; set; }
    }
}