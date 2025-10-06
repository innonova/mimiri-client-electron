export interface BaseVersion {
	baseVersion: string;
	hostVersion: string;
	releaseDate: string;
}

export const baseVersion = '2.5.39';
export const hostVersion = '2.5.41';
export const releaseDate = '2025-10-06T07:29:00.194Z';

export default {
	baseVersion,
	hostVersion,
	releaseDate
} as BaseVersion;