const cheerio = require("cheerio");
const puppeteer = require("puppeteer");
const axios = require("axios");
const ExcelJS = require("exceljs");
const fs = require("fs");

const workbook = new ExcelJS.Workbook();

const domain = "https://masothue.com";
const filePath = "output.xlsx";

// An array of 10 proxies
const proxy_list = [
	{
		protocol: "http",
		host: "149.129.239.170",
		port: 8080,
	},
	{
		protocol: "http",
		host: "132.129.121.148",
		port: 8080,
	},
	{
		protocol: "http",
		host: "154.129.98.156",
		port: 8080,
	},
	{
		protocol: "http",
		host: "211.129.132.150",
		port: 8080,
	},
	{
		protocol: "http",
		host: "164.129.114.111",
		port: 8080,
	},
];
let random_index = Math.floor(Math.random() * proxy_list.length);

const url =
	"https://masothue.com/tra-cuu-ma-so-thue-theo-nganh-nghe/san-xuat-dau-mo-dong-thuc-vat-1040";

const urlKontum =
	"https://masothue.com/tra-cuu-ma-so-thue-theo-tinh/kon-tum-956";

const Gialai = "https://masothue.com/tra-cuu-ma-so-thue-theo-tinh/gia-lai-563";

const daclak = "https://masothue.com/tra-cuu-ma-so-thue-theo-tinh/dak-lak-214";

const lamDong = "https://masothue.com/tra-cuu-ma-so-thue-theo-tinh/lam-dong-10";

const crawListLinksByCategory = async (urlCategory, fileName) => {
	const allLink = [];
	let pageCount = 1;
	while (true) {
		const linkDetailsPage = await crawlerListLinkDetailCompany(
			urlCategory,
			pageCount,
			allLink
		);
		if (!linkDetailsPage?.length) {
			break;
		}
		allLink.push(...linkDetailsPage);
		++pageCount;

		await sleep(1000);
	}
	fs.writeFileSync(`${fileName}.json`, JSON.stringify(allLink, null, 2));

	return allLink;
};

const crawlerListLinkDetailCompany = async (url, page, allLinkDetail) => {
	const options = {
		headers: {
			"User-Agent": randomUserAgent,
		},
	};

	const res = await axios.get(`${url}?page=${page}`, options);

	const $ = cheerio.load(res.data);
	const listLinkDetail = [];

	// Extract text information
	$(".tax-listing > div").map((_, element) => {
		const linkDetail = $(element)
			.find("h3 a")
			.attr("href");
		const fullLink = `${domain}${linkDetail}`;
		if (allLinkDetail.includes(fullLink)) {
			return Promise.resolve(1);
		}
		listLinkDetail.push(fullLink);
	});

	return listLinkDetail;
};

const crawlerCompanyDetail = async (url) => {
	try {
		const options = {
			headers: {
				"User-Agent": randomUserAgent,
			},
		};
		const res = await axios.get(url, options);
		const $ = cheerio.load(res.data);

		const name = $(
			'table.table-taxinfo thead tr th[itemprop="name"] span.copy'
		).text();

		const taxID = $(
			'table.table-taxinfo tbody tr td[itemprop="taxID"] span.copy'
		).text();

		const address = $(
			'table.table-taxinfo tbody tr td[itemprop="address"] span.copy'
		).text();

		const representative = $(
			'table.table-taxinfo tbody tr td:contains("Người đại diện") + td > span[itemprop="name"] > a'
		)
			.text()
			.trim();

		const telephone = $(
			'table.table-taxinfo tbody tr td[itemprop="telephone"] span.copy'
		).text();
		const activityDate = $(
			'table.table-taxinfo tbody tr td:contains("Ngày hoạt động") + td span.copy'
		).text();

		const status = $(
			'table.table-taxinfo tbody tr td:contains("Tình trạng") + td > a'
		).text();

		// Print extracted information
		return [
			name,
			address,
			representative,
			telephone,
			activityDate,
			status,
			url,
			taxID,
		];
	} catch (error) {
		return 0;
	}
};

const crawlerCompanyDetailDoanhNghiepBiz = async (url) => {
	const browser = await puppeteer.launch({
		args: ["--no-sandbox"],
		headless: true, // Set to false to see browser actions
	});
	const page = await browser.newPage();
	await page.setUserAgent(randomUserAgent);

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
		activityDate,
		status,
		url,
		taxID,
	];
};

const writeDataExcel = async (url, nameOfWorksheet) => {
	// const links = await crawListLinksByCategory(url, nameOfWorksheet);
	// console.log("links", links.length);
	const links = require(`./${nameOfWorksheet}.json`);

	await workbook.xlsx.readFile(filePath);
	const worksheet = workbook.getWorksheet(nameOfWorksheet);

	const rowCount = worksheet?.rowCount || 1;

	links.splice(0, rowCount - 1);

	// await sleep(1000);
	const listData = [];

	for (const linkDetail of links) {
		const data = await crawlerCompanyDetail(linkDetail);
		if (data !== 0) {
			listData.push(data);
			console.log("xong link: ", linkDetail);
		} else {
			break;
		}
		// await sleep(1000);
	}

	const data = [
		[
			"name",
			"taxID",
			"address",
			"representative",
			"telephone",
			"activityDate",
			"status",
			"url",
		],
		...listData,
	];

	await workbook.xlsx.readFile(filePath).then(async () => {
		let worksheet = workbook.getWorksheet(nameOfWorksheet);

		if (!worksheet) {
			worksheet = workbook.addWorksheet(nameOfWorksheet);
		} else {
			data.splice(0, 1);
		}
		worksheet.addRows(data);

		await workbook.xlsx.writeFile(filePath);
	});
};

const sleep = (ms) => {
	return new Promise((resolve) => setTimeout(resolve, ms));
};

// writeDataExcel(
// 	"https://masothue.com/tra-cuu-ma-so-thue-theo-nganh-nghe/che-bien-va-bao-quan-nuoc-mam-10204",
// 	"che-bien-va-bao-quan-nuoc-mam-10204"
// )
// 	.then(() => {
// 		console.log("SUCCESS");
// 	})
// 	.catch((error) => {
// 		console.log("ERROR", error);
// 	});

crawlerCompanyDetailDoanhNghiepBiz(
	"https://doanhnghiep.biz/2400906956-cong-ty-tnhh-che-bien-go-khac-bao"
)
	.then((res) => {
		console.log("SUCCESS", res);
	})
	.catch((error) => {
		console.log("ERROR", error);
	});
