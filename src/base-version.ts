export interface BaseVersion {
	baseVersion: string;
	hostVersion: string;
	releaseDate: string;
}

export const baseVersion = '2.5.38';
export const hostVersion = '2.5.36';
export const releaseDate = '2025-10-03T13:35:49.057Z';

export default {
	baseVersion,
	hostVersion,
	releaseDate
} as BaseVersion;