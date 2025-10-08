export interface BaseVersion {
	baseVersion: string;
	hostVersion: string;
	releaseDate: string;
}

export const baseVersion = '2.5.64';
export const hostVersion = '2.5.51';
export const releaseDate = '2025-10-08T07:11:45.765Z';

export default {
	baseVersion,
	hostVersion,
	releaseDate
} as BaseVersion;