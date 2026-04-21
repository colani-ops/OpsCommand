export function getSquadBanner(type?: string | null) {
  switch (type) {
    case "Assault":
      return "/banners/squad-assault.png";
    case "Tactical":
      return "/banners/squad-tactical.png";
    case "Recon":
      return "/banners/squad-recon.png";
    default:
      return "/banners/squad-default.png";
  }
}

export function getMissionBanner(terrain?: string | null) {
  switch (terrain) {
    case "Urban":
      return "/banners/mission-urban.png";
    case "Plains":
      return "/banners/mission-plains.png";
    case "Forest":
      return "/banners/mission-forest.png";
    case "Mountain":
      return "/banners/mission-mountain.png";
    default:
      return "/banners/mission-default.png";
  }
}

export function getEquipmentBanner(category?: string | null) {
  switch (category) {
    case "Primary":
      return "/banners/equipment-primary.png";
    case "Secondary":
      return "/banners/equipment-secondary.png";
    case "Melee":
      return "/banners/equipment-melee.png";
    case "Utility":
      return "/banners/equipment-utility.png";
    default:
      return "/banners/equipment-default.png";
  }
}

export function getUserBanner() {
  return "/banners/user-default.png";
}