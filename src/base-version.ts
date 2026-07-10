export interface BaseVersion {
	baseVersion: string;
	hostVersion: string;
	releaseDate: string;
}

export const baseVersion = '2.6.4';
export const hostVersion = '2.6.7';
export const releaseDate = '2026-07-07T07:53:09.702Z';

export default {
	baseVersion,
	hostVersion,
	releaseDate
} as BaseVersion;