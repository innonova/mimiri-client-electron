export interface BaseVersion {
	baseVersion: string;
	hostVersion: string;
	releaseDate: string;
}

export const baseVersion = '2.5.46';
export const hostVersion = '2.5.46';
export const releaseDate = '2025-10-07T11:23:12.112Z';

export default {
	baseVersion,
	hostVersion,
	releaseDate
} as BaseVersion;