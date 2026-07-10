export interface BaseVersion {
	baseVersion: string;
	hostVersion: string;
	releaseDate: string;
}

export const baseVersion = '2.6.5';
export const hostVersion = '2.6.9';
export const releaseDate = '2026-07-10T16:10:27.990Z';

export default {
	baseVersion,
	hostVersion,
	releaseDate
} as BaseVersion;