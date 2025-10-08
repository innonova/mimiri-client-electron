export interface BaseVersion {
	baseVersion: string;
	hostVersion: string;
	releaseDate: string;
}

export const baseVersion = '2.5.63';
export const hostVersion = '2.5.50';
export const releaseDate = '2025-10-08T06:40:25.701Z';

export default {
	baseVersion,
	hostVersion,
	releaseDate
} as BaseVersion;