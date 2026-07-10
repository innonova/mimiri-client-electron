export interface BaseVersion {
	baseVersion: string;
	hostVersion: string;
	releaseDate: string;
}

export const baseVersion = '2.6.6';
export const hostVersion = '2.6.12';
export const releaseDate = '2026-07-10T18:53:48.141Z';

export default {
	baseVersion,
	hostVersion,
	releaseDate
} as BaseVersion;