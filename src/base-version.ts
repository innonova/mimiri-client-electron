export interface BaseVersion {
	baseVersion: string;
	hostVersion: string;
	releaseDate: string;
}

export const baseVersion = '2.6.4';
export const hostVersion = '2.6.4';
export const releaseDate = '2026-07-05T17:06:53.502Z';

export default {
	baseVersion,
	hostVersion,
	releaseDate
} as BaseVersion;