export interface BaseVersion {
	baseVersion: string;
	hostVersion: string;
	releaseDate: string;
}

export const baseVersion = '2.6.22';
export const hostVersion = '2.6.21';
export const releaseDate = '2026-08-28T08:50:21.889Z';

export default {
	baseVersion,
	hostVersion,
	releaseDate
} as BaseVersion;