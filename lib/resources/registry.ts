import type { ResourceArticle } from "./types";
import { LEY_21719 } from "./articles/ley-21719";

/** Todos los artículos del centro de recursos (revisados o no). */
export const RESOURCE_ARTICLES: ResourceArticle[] = [LEY_21719];

export function getArticle(slug: string): ResourceArticle | null {
  return RESOURCE_ARTICLES.find((a) => a.slug === slug) ?? null;
}

/** Artículos publicables (aprobados por revisión legal). */
export function getPublishedArticles(): ResourceArticle[] {
  return RESOURCE_ARTICLES.filter((a) => a.reviewed);
}
