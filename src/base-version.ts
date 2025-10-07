export interface BaseVersion {
	baseVersion: string;
	hostVersion: string;
	releaseDate: string;
}

export const baseVersion = '2.5.48';
export const hostVersion = '2.5.47';
export const releaseDate = '2025-10-07T11:42:27.087Z';

export default {
	baseVersion,
	hostVersion,
	releaseDate
} as BaseVersion;