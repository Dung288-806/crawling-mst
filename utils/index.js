const ExcelJS = require("exceljs");
const workbook = new ExcelJS.Workbook();

const userAgentList = [
	"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.5 Safari/605.1.15",
	"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.5060.53 Safari/537.36",
	"Mozilla/5.0 (Windows NT 10.0; Windows; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.5060.114 Safari/537.36",
	"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_5) AppleWebKit/603.3.8 (KHTML, like Gecko) Version/10.1.2 Safari/603.3.8",
	"Mozilla/5.0 (Windows NT 10.0; Windows; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.5060.114 Safari/537.36",
	"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Safari/605.1.15",
	"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.5060.53 Safari/537.36",
	"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Safari/605.1.15",
	"Mozilla/5.0 (Windows NT 10.0; Windows; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.5060.114 Safari/537.36",
	"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.5060.53 Safari/537.36",
	"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/97.0.4692.71 Safari/537.36",
];

exports.randomUserAgent =
	userAgentList[Math.floor(Math.random() * userAgentList.length)];

exports.sleep = (ms) => {
	return new Promise((resolve) => setTimeout(resolve, ms));
};

exports.writeDataToExcel = async (filePath, nameOfWorksheet, listData = []) => {
	await workbook.xlsx.readFile(filePath);

	const data = [
		[
			"name",
			"taxID",
			"address",
			"representative",
			"telephone",
			"email",
			"activityDate",
			"status",
			"url",
		],
		...listData,
	];

	workbook.xlsx.readFile(filePath).then(async () => {
		let worksheet = workbook.getWorksheet(nameOfWorksheet);

		if (!worksheet) {
			worksheet = workbook.addWorksheet(nameOfWorksheet);
		} else {
			data.splice(0, 1);
		}
		worksheet.addRows(data);

		return await workbook.xlsx.writeFile(filePath);
	});
};
