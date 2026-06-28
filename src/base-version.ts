export interface BaseVersion {
	baseVersion: string;
	hostVersion: string;
	releaseDate: string;
}

export const baseVersion = '2.6.2';
export const hostVersion = '2.6.1';
export const releaseDate = '2026-06-28T11:00:14.993Z';

export default {
	baseVersion,
	hostVersion,
	releaseDate
} as BaseVersion;