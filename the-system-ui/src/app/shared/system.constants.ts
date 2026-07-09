export interface RankStyle {
  color: string;
  bg: string;
  border: string;
}

export const RANK_STYLES: Record<string, RankStyle> = {
  E: { color: '#F0997B', bg: '#2a1810', border: '#993C1D' },
  D: { color: '#85B7EB', bg: '#1a2030', border: '#378ADD' },
  C: { color: '#5DCAA5', bg: '#0d2018', border: '#1D9E75' },
  B: { color: '#AFA9EC', bg: '#2a1a2e', border: '#7F77DD' },
  A: { color: '#FAC775', bg: '#2a2210', border: '#BA7517' },
  S: { color: '#F09595', bg: '#2a0d0d', border: '#E24B4A' },
};

export function rankStyle(rank: string): RankStyle {
  return RANK_STYLES[rank] ?? RANK_STYLES['E'];
}

export interface StatMeta {
  key: keyof StatKeys;
  label: string;
  full: string;
  color: string;
}

export interface StatKeys {
  str: number;
  intelligence: number;
  vit: number;
  agi: number;
  per: number;
  hor: number;
}

export const STATS_META: StatMeta[] = [
  { key: 'str', label: 'STR', full: 'Strength — Fitness', color: '#D85A30' },
  { key: 'intelligence', label: 'INT', full: 'Intelligence — Tech Knowledge', color: '#534AB7' },
  { key: 'vit', label: 'VIT', full: 'Vitality — Health / Sleep / Food', color: '#1D9E75' },
  { key: 'agi', label: 'AGI', full: 'Agility — English Speaking', color: '#BA7517' },
  { key: 'per', label: 'PER', full: 'Perception — Problem Solving', color: '#378ADD' },
  { key: 'hor', label: 'HOR', full: 'Hormones — Testosterone Level', color: '#E24B4A' },
];

export const CATEGORY_META: Record<string, { label: string; color: string }> = {
  DAILY: { label: 'Daily Habits', color: '#1D9E75' },
  SKILL: { label: 'Skill Grind', color: '#534AB7' },
  TESTOSTERONE: { label: 'Testosterone', color: '#E24B4A' },
  SIDE: { label: 'Side Quests', color: '#FAC775' },
};

