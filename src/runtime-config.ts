import * as path from "node:path";

const userDataDirPrefix = "--user-data-dir=";
const userDataDirArg = process.argv.find((arg) =>
  arg.startsWith(userDataDirPrefix),
);

export const testMode: boolean = process.env.APP_TEST_MODE === "1";

export const apiUrlOverride: string | undefined =
  process.env.MIMIRI_API_URL || undefined;

export const blogApiUrlOverride: string | undefined =
  process.env.MIMIRI_BLOG_API_URL || undefined;

export const userDataDirOverride: string | undefined = userDataDirArg
  ? path.resolve(userDataDirArg.substring(userDataDirPrefix.length))
  : undefined;
