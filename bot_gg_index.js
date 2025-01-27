const puppeteer = require("puppeteer");
const UrlAPI = "https://ihavedomain.com/API.php";
let errorCount = 0;
let last3Domains = [];
let selector = {
  url: "https://www.google.com",
  inputDomain: "#APjFqb",
  indexDomain: "cite",
};

// Process
const fetchData = async () => {
  let domainId = null;
  try {
    console.log("Wait to Process");
    const response = await fetch(`${UrlAPI}/indexList`);
    const json = await response.json();
    const dataJson = json?.map((result) => result).filter(Boolean) || [];

    for (const data of dataJson) {
      domainId = data.id;
      const domain = data.domain;
      const nameDomain = data.name;

      try {
        console.log(`${domain} -> Waiting to search...`);
        await SendDataToDB(domainId, domain, nameDomain);
      } catch (err) {
        throw err;
      }
    }
  } catch (err) {
    console.error("[Fetch Error] -> ", err);
    last3Domains.push(domainId);

    if (last3Domains.length > 3) {
      last3Domains.shift();
    }

    const allSameDomain = last3Domains.every(
      (domain) => domain === last3Domains[0]
    );

    if (allSameDomain) {
      errorCount++;
    } else {
      errorCount = 0;
    }

    if (errorCount >= 3) {
      try {
        const errorBot = err.message;
        SendLogs(errorBot);
        SendDNF(domainId);

        console.log("Domain DNF 3 times");
      } catch (error) {
        console.error("Error sending error report:", error);
      }

      errorCount = 0;
      last3Domains = [];
    }
  } finally {
    setTimeout(fetchData, 15000);
  }
};
fetchData();
// Process

//search data
const SendDataToDB = async (domainId, domain, NameDomain) => {
  let browser;
  try {
    browser = await puppeteer.launch({
    //   browserWSEndpoint: getConnectionURL(),
      headless: true,
      slowMo: 0,
      args: getRandomArgs(),
      defaultViewport: null,
      //   executablePath: '/usr/bin/chromium-browser',
    });

    const page = await browser.newPage();
    console.log("\n");
    console.log("Search Full_Index_Domian");

    await page.evaluateOnNewDocument(() => {
        Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
        Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
        Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3] });
      });
    
      await page.evaluateOnNewDocument(() => { 
        const getParameter = WebGLRenderingContext.prototype.getParameter;
        WebGLRenderingContext.prototype.getParameter = function (parameter) {
          
          if (parameter === 37445) {
            return "Intel Inc."; 
          }
          if (parameter === 37446) {
            return "Intel Iris OpenGL Engine"; 
          }
          return getParameter(parameter);
        };
      });

    await page.goto(selector.url, { waitUntil: 'networkidle2' });
    await page.waitForSelector(selector.inputDomain);

    const WaitInput = Math.floor(Math.random() * 5000) + 2000;
    await new Promise((resolve) => setTimeout(resolve, WaitInput));

    await typingWord(page, selector.inputDomain, domain);

    const WaitClick = Math.floor(Math.random() * 4000) + 2000;
    await new Promise((resolve) => setTimeout(resolve, WaitClick));
    await page.keyboard.press("Enter");
    await page.waitForSelector(selector.indexDomain);

    const data = await page.evaluate(() => {
      const index_domain = document.querySelector("cite").innerText;
      return { index_domain };
    });

    await new Promise((resolve) => setTimeout(resolve, 4000));

    console.log("Search Full_Index_Name");

    await page.waitForSelector(selector.inputDomain);
    await page.focus(selector.inputDomain);
    const WaitCtrlA = Math.floor(Math.random() * 3000) + 2000;
    await new Promise((resolve) => setTimeout(resolve, WaitCtrlA));
    await page.keyboard.down("Control");
    await page.keyboard.press("KeyA");
    await page.keyboard.up("Control");
    const WaitDel = Math.floor(Math.random() * 3000) + 2000;
    await new Promise((resolve) => setTimeout(resolve, WaitDel));
    await page.keyboard.press("Backspace");

    const WaitInput2 = Math.floor(Math.random() * 4000) + 2000;
    await typingWord(page, selector.inputDomain, NameDomain);

    const WaitEnter = Math.floor(Math.random() * 4000) + 2000;
    await new Promise((resolve) => setTimeout(resolve, WaitEnter));
    await page.keyboard.press("Enter");
    await page.waitForSelector(selector.indexDomain);

    const data2 = await page.evaluate(() => {
      const index_name = document.querySelector("cite").innerText;
      return { index_name };
    });

    const full_domain = data.index_domain;
    const full_name = data2.index_name;

    function extractDomain(full_name) {
      return full_name.split(" ")[0];
    }
    const url_split = extractDomain(full_name);

    if (full_domain.includes(domain.toLowerCase())) {
      index_domain = "true";
    } else {
      index_domain = "false";
    }

    if (url_split.includes(NameDomain)) {
      index_name = "true";
    } else {
      index_name = "false";
    }

    console.log("url : " + domain);
    console.log("index is : " + full_domain);
    console.log(index_domain);
    console.log("name : " + NameDomain);
    console.log("index is : " + full_name);
    console.log(index_name);
    //search data

    //sent data to db
    const URL = `${UrlAPI}/updateIndex`;
    const payload = {
      id: domainId,
      index_domain: index_domain,
      index_name: index_name,
      full_domain: full_domain,
      full_name: full_name,
    };

    const payloads = JSON.stringify(payload);
    await fetch(URL, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: payloads,
    })
      .then((response) => response.json())
      .then((data) => {
        console.log(domain, data);
      })
      .catch((error) => {
        console.error("Error:", error);
      });

    await new Promise((resolve) => setTimeout(resolve, 4000));
    await browser.close();
  } catch (err) {
    console.error("[SendDataToDB Error] -> ", err);
    if (browser) {
      await browser.close();
    }
    throw err;
  }
};

const SendLogs = async (errorBot) => {
  const URL_logs = `${UrlAPI}/updateError`;

  await fetch(URL_logs, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ errorBot: errorBot }),
  })
    .then((response) => response.json())
    .then((data) => {
      console.log(data);
    })
    .catch((error) => {
      console.error("ErrorBOT:", error);
    });
};

const SendDNF = async (id) => {
  const URL_DNF = `${UrlAPI}/updateDNF`;

  await fetch(URL_DNF, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ id: id }),
  })
    .then((response) => response.json())
    .then((data) => {
      console.log(data);
    })
    .catch((error) => {
      console.error("ErrorDNF:", error);
    });
};
//sent data to db

//rondom arg bot
function getConnectionURL() {
    const connectionURL = [
        'wss://browser.zenrows.com?apikey=3260b2a91551dbfd895a1420ca77ab02e8be5ac0',
        'wss://browser.zenrows.com?apikey=d6c5211efc890e345b032900cc97cb9cfecb98eb',
        'wss://browser.zenrows.com?apikey=f25b47742b00a5b14a778d069411dc573ff03a26'
    ];
    const randomConnectionURL = connectionURL[Math.floor(Math.random() * connectionURL.length)];
    return randomConnectionURL;
}

function getRandomArgs() {
  const userAgentList = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.5195.125 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.5112.101 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.5060.66 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/102.0.5005.61 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/101.0.4951.54 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.127 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.4844.82 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.102 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/97.0.4692.71 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.45 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.54 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.81 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/93.0.4577.63 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.131 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.93 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.82 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.96 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.75 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.121 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/84.0.4147.135 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.97 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/82.0.4085.4 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.138 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.149 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.88 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.108 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.120 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/76.0.3809.132 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3770.100 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.169 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.103 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/72.0.3626.121 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/71.0.3578.98 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.102 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.92 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3440.106 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/67.0.3396.99 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/66.0.3359.181 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3325.162 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.140 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/63.0.3239.132 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3202.94 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/61.0.3163.100 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.113 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.115 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36",

  ];

  const windowSizes = [
    "1920,1080",
    "1366,768",
    "1280,720",
    "1440,900",
    "1600,900",
    "2560,1440",
    "1280,1024",
    "1440,1080",
    "1920,1200",
    "1360,768",
    "1280,800",
    "1600,1200",
    "1024,768",
    "1280,600",
    "1920,1400",
  ];

  const randomUserAgent =
    userAgentList[Math.floor(Math.random() * userAgentList.length)];
  const randomWindowSize =
    windowSizes[Math.floor(Math.random() * windowSizes.length)];
  const viewportWidthHeight = randomWindowSize.split(",");
  const randomViewportWidth = parseInt(viewportWidthHeight[0]);
  const randomViewportHeight = parseInt(viewportWidthHeight[1]);

  return [
    `--no-sandbox`,
    `--disable-setuid-sandbox`,
    `--disable-infobars`,
    `--window-position=0,0`,
    `--ignore-certifcate-errors`,
    `--ignore-certifcate-errors-spki-list`,
    `--disable-accelerated-2d-canvas`,
    `--disable-gpu`,
    `--window-size=${randomWindowSize}`,
    `--user-agent=${randomUserAgent}`,
    `--disable-blink-features=AutomationControlled`, 
    `--disable-dev-shm-usage`, 
    `--enable-features=NetworkService,NetworkServiceInProcess`,
    `--lang=en-US`,
    // `--proxy-server=proxy-server.com:8080`,
    `--disable-extensions`,
    `--headless=new`,
    `--no-first-run`,
    `--disable-software-rasterizer`,
    `--disable-background-timer-throttling`,
    `--disable-breakpad`,
    `--remote-debugging-port=9222`,
    `--enable-features=WebUIDarkMode,OverlayScrollbar`,
    `--disable-device-discovery-notifications`,
    `--disable-hang-monitor`,
    `--no-sandbox`,
    `--disable-gesture`,
  ];
}
//rondom arg bot

//random typing word
function getRandomCharacter() {
  const characters =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890";
  return characters.charAt(Math.floor(Math.random() * characters.length));
}

async function typingWord(page, selector, text) {
  for (let i = 0; i < text.length; i++) {
    const delay = Math.random() * 300 + 250;
    await page.type(selector, text[i], { delay: delay });

    if (Math.random() > 0.85) {
      const wrongChar = getRandomCharacter();
      await page.type(selector, wrongChar, { delay: delay });
      const backspaceDelay = Math.random() * 200 + 100;
      await new Promise((resolve) => setTimeout(resolve, backspaceDelay));
      await page.keyboard.press("Backspace");

      const afterBackspaceDelay = Math.random() * 800 + 400;
      await new Promise((resolve) => setTimeout(resolve, afterBackspaceDelay));
    }

    if (Math.random() > 0.85) {
      const stopDelay = Math.random() * 2000 + 1000;
      await new Promise((resolve) => setTimeout(resolve, stopDelay));
    }
  }
}
//random typing word
