export interface BaseVersion {
	baseVersion: string;
	hostVersion: string;
	releaseDate: string;
}

export const baseVersion = '2.6.19';
export const hostVersion = '2.6.19';
export const releaseDate = '2026-08-01T06:44:23.273Z';

export default {
	baseVersion,
	hostVersion,
	releaseDate
} as BaseVersion;