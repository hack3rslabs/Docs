import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  // Prevent webpack from bundling pdfkit so that __dirname resolves correctly
  // inside pdfkit's own code, allowing it to find its bundled .afm font files.
  serverExternalPackages: ["pdfkit"],
};

export default nextConfig;
