export interface BaseVersion {
  baseVersion: string;
  hostVersion: string;
  releaseDate: string;
}

export const baseVersion = "2.5.34";
export const hostVersion = "2.5.25";
export const releaseDate = "2025-10-01T13:11:55.740Z";

export default {
  baseVersion,
  hostVersion,
  releaseDate,
} as BaseVersion;
