export interface BaseVersion {
	baseVersion: string;
	hostVersion: string;
	releaseDate: string;
}

export const baseVersion = '2.5.65';
export const hostVersion = '2.5.52';
export const releaseDate = '2025-10-08T07:20:29.502Z';

export default {
	baseVersion,
	hostVersion,
	releaseDate
} as BaseVersion;