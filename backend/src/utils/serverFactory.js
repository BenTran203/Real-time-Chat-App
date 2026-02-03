import { createServer } from "http";

/**
 * Creates an HTTP server
 * 
 * NOTE: For cloud deployments (Railway, Render, Heroku, etc.),
 * ALWAYS use HTTP. The cloud provider handles SSL/HTTPS termination
 * at the proxy level. Your app receives HTTP from the proxy.
 * 
 * @param {Express.Application} app
 */
export const createWebServer = (app) => {
  console.log("🌐 HTTP server created");
  return createServer(app);
};
