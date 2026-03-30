namespace OpsCommand.Api.Models.UserEquipment
{
    public class UserEquipmentResponseDto
    {
        public int EquipmentId { get; set; }
        public string EquipmentName { get; set; } = default!;
        public string? Category { get; set; }
        public int Quantity { get; set; }
    }
}