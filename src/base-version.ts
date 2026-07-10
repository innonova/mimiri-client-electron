export interface BaseVersion {
	baseVersion: string;
	hostVersion: string;
	releaseDate: string;
}

export const baseVersion = '2.6.4';
export const hostVersion = '2.6.9';
export const releaseDate = '2026-07-10T14:39:35.073Z';

export default {
	baseVersion,
	hostVersion,
	releaseDate
} as BaseVersion;