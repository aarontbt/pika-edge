import { cronJobs } from "convex/server";

const crons = cronJobs();

// Cron disabled per request; manual triggering only.

export default crons;
