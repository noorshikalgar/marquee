import type { InteractionType } from "@movie-scout/shared";
import { ApiHttpError } from "../middleware/errorHandler.js";
import {
  addInteraction,
  getInteractionById,
  listInteractions,
  removeInteraction,
} from "../db/repositories/interactionsRepo.js";
import { getTitlesByIds, toTitleDtos } from "../db/repositories/titlesRepo.js";
import { recalculatePreferences } from "./preferenceService.js";

export function recordInteraction(userId: number, titleId: number, type: InteractionType) {
  const row = addInteraction(userId, titleId, type);
  recalculatePreferences(userId);
  return row;
}

export function deleteInteraction(userId: number, id: number) {
  const row = getInteractionById(id);
  if (!row || row.userId !== userId) throw new ApiHttpError(404, "not_found", "Interaction not found");
  removeInteraction(id);
  recalculatePreferences(userId);
}

export function getInteractions(userId: number, type?: InteractionType) {
  return listInteractions(userId, type);
}

export async function getInteractedTitles(userId: number, type: InteractionType) {
  const rows = listInteractions(userId, type);
  const orderedIds = [...new Set(rows.map((r) => r.titleId))];
  const titleRows = getTitlesByIds(orderedIds);
  const byId = new Map(titleRows.map((t) => [t.id, t]));
  const ordered = orderedIds.map((id) => byId.get(id)).filter((t): t is NonNullable<typeof t> => !!t);
  return toTitleDtos(ordered);
}
