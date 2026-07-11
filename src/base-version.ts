export interface BaseVersion {
	baseVersion: string;
	hostVersion: string;
	releaseDate: string;
}

export const baseVersion = '2.6.9';
export const hostVersion = '2.6.15';
export const releaseDate = '2026-07-11T19:08:42.131Z';

export default {
	baseVersion,
	hostVersion,
	releaseDate
} as BaseVersion;