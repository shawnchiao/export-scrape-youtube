import puppeteer from "puppeteer";

export async function scrapeYouTubeData(videoId) {
  const browser = await puppeteer.launch({ headless: true });

  return new Promise(async (resolve, reject) => {
    try {
      const page = await browser.newPage();
      const client = await page.createCDPSession();
      await client.send("Debugger.enable");
      await client.send("Debugger.setAsyncCallStackDepth", { maxDepth: 32 });
      await client.send("Network.enable");

      client.on("Network.requestWillBeSent", (e) => {
        if (e.request.url.includes("/youtubei/v1/player")) {
          const jsonData = JSON.parse(e.request.postData);
          const poToken = jsonData["serviceIntegrityDimensions"]["poToken"];
          const visitorData = jsonData["context"]["client"]["visitorData"];

          resolve({ poToken: poToken, visitorData: visitorData });
          browser.close();
        }
      });

      await page.goto("https://www.youtube.com/embed/" + videoId, {
        waitUntil: "networkidle2",
      });

      const playButton = await page.$("#movie_player");
      await playButton.click();
    } catch (error) {
      console.error("Error scraping YouTube data:", error);
      await browser.close();
      reject(error);
    }
  });
}