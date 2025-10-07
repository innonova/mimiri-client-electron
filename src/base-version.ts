export interface BaseVersion {
	baseVersion: string;
	hostVersion: string;
	releaseDate: string;
}

export const baseVersion = '2.5.41';
export const hostVersion = '2.5.45';
export const releaseDate = '2025-10-07T06:46:55.332Z';

export default {
	baseVersion,
	hostVersion,
	releaseDate
} as BaseVersion;