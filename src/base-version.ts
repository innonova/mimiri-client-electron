export interface BaseVersion {
	baseVersion: string;
	hostVersion: string;
	releaseDate: string;
}

export const baseVersion = '2.5.57';
export const hostVersion = '2.5.48';
export const releaseDate = '2025-10-07T14:21:20.343Z';

export default {
	baseVersion,
	hostVersion,
	releaseDate
} as BaseVersion;