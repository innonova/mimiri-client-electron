export interface BaseVersion {
	baseVersion: string;
	hostVersion: string;
	releaseDate: string;
}

export const baseVersion = '2.5.93';
export const hostVersion = '2.6.1';
export const releaseDate = '2025-11-11T15:34:14.955Z';

export default {
	baseVersion,
	hostVersion,
	releaseDate
} as BaseVersion;