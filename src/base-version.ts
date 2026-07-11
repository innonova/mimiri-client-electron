export interface BaseVersion {
	baseVersion: string;
	hostVersion: string;
	releaseDate: string;
}

export const baseVersion = '2.6.8';
export const hostVersion = '2.6.14';
export const releaseDate = '2026-07-11T18:08:40.621Z';

export default {
	baseVersion,
	hostVersion,
	releaseDate
} as BaseVersion;