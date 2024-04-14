const puppeteer = require("puppeteer");
const cheerio = require("cheerio");
const fs = require("fs");

const utilFunction = require("./utils");

const runCrawler = async (url) => {
	const browser = await puppeteer.launch({
		args: ["--no-sandbox"],
		headless: true, // Set to false to see browser actions
	});
	const page = await browser.newPage();
	await page.setUserAgent(
		"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/97.0.4692.71 Safari/537.36"
	);

	// Navigate to the URL you want to crawl
	await page.goto(url);

	const htmlContent = await page.content();

	const $ = cheerio.load(htmlContent);
	const name = $('table.company-table thead tr th[itemprop="name"]')
		.text()
		.trim();

	const address = $('table.company-table tbody tr td[itemprop="address"]')
		.text()
		.trim();

	const representative = $(
		'table.company-table tbody tr td > span[itemprop="Owner"] > a'
	)
		.text()
		.trim();

	const telephone = $('table.company-table tbody tr td[itemprop="Phone"]')
		.text()
		.trim();

	const email = $('table.company-table tbody tr td[itemprop="Email"]')
		.text()
		.trim();

	const activityDate = $(
		'table.company-table tbody tr td[itemprop="StartDate"]'
	)
		.text()
		.trim();

	const status = $('table.company-table tbody tr td[itemprop="Status"]')
		.text()
		.trim();

	const taxID = $('table.company-table tbody tr td[itemprop="taxID"]')
		.text()
		.trim();

	await browser.close();

	return [
		name,
		address,
		representative,
		telephone,
		email,
		activityDate,
		status,
		url,
		taxID,
	];
};

const crawlLinkDetailByPage = async (url) => {
	try {
		const browser = await puppeteer.launch({
			args: ["--no-sandbox"],
			headless: true, // Set to false to see browser actions
		});
		const page = await browser.newPage();
		await page.setUserAgent(utilFunction.randomUserAgent);

		await page.goto(url);

		const htmlContent = await page.content();

		const listLinkDetail = [];
		const $ = cheerio.load(htmlContent);
		const listCompanies = $(".col-md-9 > div");

		if (listCompanies?.length) {
			$(".col-md-9 > div").map((_, element) => {
				const linkDetail = $(element)
					.find("a")
					.attr("href");
				const fullLink = `https://doanhnghiep.biz${linkDetail}`;
				listLinkDetail.push(fullLink);
			});
		}

		await browser.close();

		return listLinkDetail;
	} catch (error) {
		console.log("crawlLinkDetailByPage", error);
	}
};

const crawListLinksByCategory = async (urlCategory, fileName) => {
	try {
		const allLink = [];
		let pageCount = 4;
		while (true) {
			const linkDetailsPage = await crawlLinkDetailByPage(
				`${urlCategory}&p=${pageCount}`
			);
			if (!linkDetailsPage?.length) {
				break;
			}
			allLink.push(...linkDetailsPage);
			// console.log("xong link: ", `${urlCategory}&p=${pageCount}`);

			++pageCount;
			await utilFunction.sleep(2000);
		}
		// fs.writeFileSync(`${fileName}.json`, JSON.stringify(allLink, null, 2));

		return allLink;
	} catch (error) {
		console.log("crawListLinksByCategory", error);
	}
};

exports.handler = async (event) => {
	console.log(`EVENT: ${JSON.stringify(event)}`);
	console.log("TOM OI =========================  ");

	crawListLinksByCategory(
		"https://doanhnghiep.biz/nganh-nghe/?timkiemNganhNghe=C1040",
		"dau-mo-dtv"
	)
		.then((res) => {
			console.log("Crawler finished", res);
		})
		.catch((error) => console.error("Error:", error));

	return {
		statusCode: 200,
		body: JSON.stringify("TOM OI ================ Hello from Lambda!"),
	};
};
