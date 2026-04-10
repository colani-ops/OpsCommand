import type { CSSProperties } from "react";
import type { MissionDto } from "../api/missions";

type MissionOutcomeProps = {
  mission: MissionDto;
};

function getOutcomeText(mission: MissionDto) {
  if (mission.wasSuccessful == null) return "—";
  return mission.wasSuccessful ? "Success" : "Failure";
}

function getOutcomeStyle(mission: MissionDto): CSSProperties {
  if (mission.wasSuccessful == null) {
    return { opacity: 0.85, fontWeight: 600 };
  }

  return {
    fontWeight: 700,
    color: mission.wasSuccessful ? "#7CFC98" : "#FF7B7B",
  };
}

export default function MissionOutcome({ mission }: MissionOutcomeProps) {
  return <div style={{ marginTop: 6, ...getOutcomeStyle(mission) }}>Outcome: {getOutcomeText(mission)}</div>;
}