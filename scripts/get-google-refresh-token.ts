import "dotenv/config";
import http from "node:http";
import { google } from "googleapis";

const PORT = 5555;
const REDIRECT_URI = `http://localhost:${PORT}/oauth2callback`;

const clientId = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

if (!clientId || !clientSecret) {
  console.error(
    "Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env before running this script.",
  );
  process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(
  clientId,
  clientSecret,
  REDIRECT_URI,
);

const authUrl = oauth2Client.generateAuthUrl({
  access_type: "offline",
  prompt: "consent",
  scope: ["https://www.googleapis.com/auth/calendar"],
});

console.log("\n請在瀏覽器打開這個連結，用你要接的那個 Google 帳號登入並同意授權：\n");
console.log(authUrl);
console.log("\n等待授權完成...\n");

const server = http.createServer(async (req, res) => {
  if (!req.url?.startsWith("/oauth2callback")) {
    res.writeHead(404);
    res.end();
    return;
  }

  const url = new URL(req.url, REDIRECT_URI);
  const code = url.searchParams.get("code");

  if (!code) {
    res.writeHead(400);
    res.end("Missing authorization code.");
    return;
  }

  try {
    const { tokens } = await oauth2Client.getToken(code);
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end("<h1>授權成功，可以關掉這個分頁了。</h1>");

    console.log("授權成功！把這組值加到 .env：\n");
    console.log(`GOOGLE_REFRESH_TOKEN="${tokens.refresh_token}"`);
    console.log();
  } catch (err) {
    res.writeHead(500);
    res.end("Token exchange failed.");
    console.error(err);
  } finally {
    server.close();
    process.exit(0);
  }
});

server.listen(PORT);
