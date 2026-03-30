namespace OpsCommand.Api.Domain.Entities
{
    public class UserEquipment
    {
        public string UserId { get; set; } = default!;
        public ApplicationUser User { get; set; } = null!;

        public int EquipmentId { get; set; }
        public Equipment Equipment { get; set; } = null!;

        public int Quantity { get; set; }
    }
}