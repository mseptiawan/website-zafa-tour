import puppeteer from "puppeteer";

export const renderHtmlToPdf = async (htmlContent, delayMs = 350) => {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: "networkidle0" });

    if (delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "0px", bottom: "0px", left: "0px", right: "0px" },
    });

    return pdfBuffer;
  } finally {
    await browser.close();
  }
};
