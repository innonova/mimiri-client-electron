export interface BaseVersion {
	baseVersion: string;
	hostVersion: string;
	releaseDate: string;
}

export const baseVersion = '2.5.37';
export const hostVersion = '2.5.34';
export const releaseDate = '2025-10-02T11:15:58.273Z';

export default {
	baseVersion,
	hostVersion,
	releaseDate
} as BaseVersion;