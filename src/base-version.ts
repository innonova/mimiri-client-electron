export interface BaseVersion {
	baseVersion: string;
	hostVersion: string;
	releaseDate: string;
}

export const baseVersion = '2.6.25';
export const hostVersion = '2.6.22';
export const releaseDate = '2026-08-28T15:47:44.210Z';

export default {
	baseVersion,
	hostVersion,
	releaseDate
} as BaseVersion;