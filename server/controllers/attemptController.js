// GET /api/attempts/:attemptId
import prisma from "../config/db.js";

/**
 * Get Player Stats for an Attempt (Attempt Breakdown Table)
 * GET /api/logs/{logId}/encounters/{encounterName}/attempts/{startTime}
 */
export const getAttemptDetails = async (req, res) => {
  try {
    const { logId, encounterName, startTime } = req.params;

    const attempt = await prisma.attempt.findFirst({
      where: {
        startTime: new Date(decodeURIComponent(startTime)),
        boss: {
          encounter: {
            name: decodeURIComponent(encounterName),
            logId: parseInt(logId),
          },
        },
      },
      include: {
        players: { include: { player: true } },
      },
    });

    if (!attempt) {
      return res.status(404).json({ error: "Attempt not found" });
    }

    const totalDuration =
      (new Date(attempt.endTime) - new Date(attempt.startTime)) / 1000;

    const formattedData = attempt.players.map((p) => ({
      playerName: p.player.name,
      totalDamage: p.damageDone,
      dps: totalDuration ? (p.damageDone / totalDuration).toFixed(2) : 0,
      totalHealing: p.healingDone,
      hps: totalDuration ? (p.healingDone / totalDuration).toFixed(2) : 0,
    }));

    res.json(formattedData);
  } catch (error) {
    console.error("❌ Error fetching attempt details:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
