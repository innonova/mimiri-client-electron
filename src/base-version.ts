export interface BaseVersion {
	baseVersion: string;
	hostVersion: string;
	releaseDate: string;
}

export const baseVersion = '2.6.16';
export const hostVersion = '2.6.16';
export const releaseDate = '2026-07-20T18:23:05.316Z';

export default {
	baseVersion,
	hostVersion,
	releaseDate
} as BaseVersion;