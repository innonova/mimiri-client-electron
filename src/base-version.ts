export interface BaseVersion {
	baseVersion: string;
	hostVersion: string;
	releaseDate: string;
}

export const baseVersion = '2.6.27';
export const hostVersion = '2.6.23';
export const releaseDate = '2026-08-29T07:40:00.312Z';

export default {
	baseVersion,
	hostVersion,
	releaseDate
} as BaseVersion;