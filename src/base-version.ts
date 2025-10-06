export interface BaseVersion {
	baseVersion: string;
	hostVersion: string;
	releaseDate: string;
}

export const baseVersion = '2.5.40';
export const hostVersion = '2.5.43';
export const releaseDate = '2025-10-06T10:56:47.497Z';

export default {
	baseVersion,
	hostVersion,
	releaseDate
} as BaseVersion;