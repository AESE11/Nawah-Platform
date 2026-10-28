import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import dotenv from "dotenv";

const SCRIPT_DIRECTORY = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(SCRIPT_DIRECTORY, "..");
const ENV_FILE = path.join(PROJECT_ROOT, ".env.nawah");
const EXPECTED_SUPABASE_PROJECT_REF = "izltqxnurilucfcwotfb";
const NEXT_ENV_FILES = [
  ".env",
  ".env.local",
  ".env.development",
  ".env.development.local",
  ".env.production",
  ".env.production.local",
  ".env.test",
  ".env.test.local",
];

function prepareEnvironment({
  primaryContent,
  fallbackContents,
  inheritedEnvironment,
  command,
}) {
  const primaryEnvironment = dotenv.parse(primaryContent);
  const environment = { ...inheritedEnvironment };

  for (const content of fallbackContents) {
    for (const key of Object.keys(dotenv.parse(content))) {
      if (!Object.hasOwn(primaryEnvironment, key)) {
        environment[key] = "";
      }
    }
  }

  Object.assign(environment, primaryEnvironment);
  validateDatabaseUrl(environment, "DATABASE_URL");
  validateDatabaseUrl(environment, "DIRECT_URL");

  if (command === "dev") {
    environment.NEXTAUTH_URL = "http://localhost:3000";
  } else if (
    (command === "build" || command === "start") &&
    !environment.NEXTAUTH_URL
  ) {
    throw new Error(
      `NEXTAUTH_URL is required in .env.nawah for ${command}; set the correct application origin.`,
    );
  }

  if (command === "build" || command === "start") {
    let authUrl;
    try {
      authUrl = new URL(environment.NEXTAUTH_URL);
    } catch {
      throw new Error("NEXTAUTH_URL in .env.nawah must be a valid application URL.");
    }

    if (authUrl.protocol !== "http:" && authUrl.protocol !== "https:") {
      throw new Error("NEXTAUTH_URL in .env.nawah must use HTTP or HTTPS.");
    }
  }

  environment.NAWAH_LOCAL_LOOPBACK_IP =
    command === "start" &&
    inheritedEnvironment.NODE_ENV !== "production" &&
    inheritedEnvironment.VERCEL !== "1"
      ? "1"
      : "0";

  return environment;
}

function validateDatabaseUrl(environment, variableName) {
  const value = environment[variableName];
  if (!value) {
    throw new Error(`${variableName} is missing from .env.nawah.`);
  }

  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`${variableName} in .env.nawah is not a valid database URL.`);
  }

  if (url.protocol !== "postgres:" && url.protocol !== "postgresql:") {
    throw new Error(`${variableName} in .env.nawah must use PostgreSQL.`);
  }

  let username = url.username;
  try {
    username = decodeURIComponent(username);
  } catch {
    throw new Error(`${variableName} in .env.nawah is not a valid database URL.`);
  }

  if (
    !url.hostname.toLowerCase().includes(EXPECTED_SUPABASE_PROJECT_REF) &&
    !username.toLowerCase().includes(EXPECTED_SUPABASE_PROJECT_REF)
  ) {
    throw new Error(
      `${variableName} in .env.nawah does not reference the expected Supabase project.`,
    );
  }
}

function readFallbackContents() {
  return NEXT_ENV_FILES
    .map((file) => path.join(PROJECT_ROOT, file))
    .filter((file) => fs.existsSync(file))
    .map((file) => fs.readFileSync(file, "utf8"));
}

function runNodeScript(scriptPath, args, environment) {
  const result = spawnSync(
    process.execPath,
    [path.join(PROJECT_ROOT, scriptPath), ...args],
    {
      cwd: PROJECT_ROOT,
      env: environment,
      stdio: "inherit",
    },
  );

  if (result.error) {
    throw new Error("Unable to start the requested project command.");
  }

  return result.status ?? 1;
}

function runPrismaCommand(prismaArgs, environment) {
  const result = spawnSync(
    process.execPath,
    [path.join(PROJECT_ROOT, "node_modules/prisma/build/index.js"), ...prismaArgs],
    {
      cwd: PROJECT_ROOT,
      env: environment,
      encoding: "utf8",
      maxBuffer: 10 * 1024 * 1024,
      stdio: ["ignore", "pipe", "pipe"],
    },
  );

  if (result.error || result.status !== 0) {
    console.error("Prisma command failed; environment-sensitive output was suppressed.");
    return result.status ?? 1;
  }

  if (prismaArgs[0] === "migrate") {
    const output = `${result.stdout}\n${result.stderr}`;
    if (/Database schema is up to date!?/i.test(output)) {
      console.log("Database schema is up to date.");
    } else {
      console.log("Prisma migrate status completed successfully.");
    }
  } else if (prismaArgs[0] === "generate") {
    console.log("Prisma Client generation completed successfully.");
  } else {
    console.log("Prisma schema validation completed successfully.");
  }

  return 0;
}

function runCommand(command, args, environment) {
  const nextCli = "node_modules/next/dist/bin/next";

  if (command === "dev") {
    return runNodeScript(nextCli, [command, ...args], environment);
  }

  if (command === "start") {
    const startArgs = environment.NAWAH_LOCAL_LOOPBACK_IP === "1"
      ? [...args, "--hostname", "127.0.0.1"]
      : args;
    return runNodeScript(nextCli, [command, ...startArgs], environment);
  }

  if (command === "build") {
    const generateStatus = runPrismaCommand(["generate"], environment);
    if (generateStatus !== 0) {
      return generateStatus;
    }
    return runNodeScript(nextCli, ["build", ...args], environment);
  }

  if (command === "prisma") {
    const [prismaCommand, ...prismaArgs] = args;
    const allowedCommands = new Set(["generate", "validate", "migrate"]);
    if (!allowedCommands.has(prismaCommand)) {
      throw new Error(
        "Supported Prisma commands are generate, validate, and migrate status.",
      );
    }
    if (
      prismaCommand === "migrate" &&
      (prismaArgs.length !== 1 || prismaArgs[0] !== "status")
    ) {
      throw new Error("Only the read-only Prisma command migrate status is allowed.");
    }
    if (
      prismaCommand !== "migrate" &&
      prismaArgs.length !== 0
    ) {
      throw new Error("Unexpected Prisma command arguments.");
    }

    return runPrismaCommand([prismaCommand, ...prismaArgs], environment);
  }

  throw new Error("Unknown environment-aware project command.");
}

function main(args) {
  const [command, ...commandArgs] = args;
  if (!command) {
    throw new Error("Specify dev, build, start, or prisma.");
  }

  if (process.env.VERCEL === "1" && !fs.existsSync(ENV_FILE)) {
    process.exitCode = runCommand(command, commandArgs, process.env);
    return;
  }

  if (!fs.existsSync(ENV_FILE)) {
    throw new Error("Required local environment file .env.nawah was not found.");
  }

  const environment = prepareEnvironment({
    primaryContent: fs.readFileSync(ENV_FILE, "utf8"),
    fallbackContents: readFallbackContents(),
    inheritedEnvironment: process.env,
    command,
  });

  process.exitCode = runCommand(command, commandArgs, environment);
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
) {
  try {
    main(process.argv.slice(2));
  } catch (error) {
    console.error(
      error instanceof Error
        ? error.message
        : "Unable to prepare the local project environment.",
    );
    process.exitCode = 1;
  }
}

export { prepareEnvironment };
