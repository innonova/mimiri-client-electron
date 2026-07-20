export interface BaseVersion {
	baseVersion: string;
	hostVersion: string;
	releaseDate: string;
}

export const baseVersion = '2.6.17';
export const hostVersion = '2.6.17';
export const releaseDate = '2026-07-20T19:09:58.805Z';

export default {
	baseVersion,
	hostVersion,
	releaseDate
} as BaseVersion;