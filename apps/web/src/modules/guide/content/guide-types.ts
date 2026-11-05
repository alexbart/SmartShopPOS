/**
 * Shape of the in-app guide.
 *
 * Content lives in TypeScript modules rather than Markdown so every step is
 * type-checked, links stay in sync with the router, and no Markdown parser is
 * pulled into the bundle. See `user-guide.ts` and `dev-guide.ts`.
 */

export type GuideAudience = 'user' | 'dev';

export interface GuideStep {
  title: string;
  body: string;
  /** Optional aside rendered as a tip under the step. */
  tip?: string;
}

export interface GuideCodeBlock {
  label: string;
  language?: 'bash' | 'http' | 'json';
  code: string;
}

export interface GuideSection {
  id: string;
  title: string;
  summary: string;
  /** Screen the reader should open to follow along, if there is one. */
  path?: string;
  steps: GuideStep[];
  code?: GuideCodeBlock;
  /** Caveats and gotchas rendered below the steps. */
  notes?: string[];
}

export interface GuideChapter {
  id: string;
  title: string;
  sections: GuideSection[];
}

export interface Guide {
  audience: GuideAudience;
  title: string;
  description: string;
  chapters: GuideChapter[];
}

/** Flattens a guide for the table of contents. */
export function collectSections(guide: Guide): GuideSection[] {
  return guide.chapters.flatMap((chapter) => chapter.sections);
}
