Hello there.
This is first my test scraper for your suggested website: alertaalertalicitacao.com.br.
You can try intall this project on your Laptop, and if you meet any issues, plz let me know.
And if you have some question and more requirements, send me message again.

Read and follow this step by step install and run:

A Node.js-based web scraper for extracting tender information from alertalicitacao.com.br. This tool automatically searches and extracts tender details, saving them in both JSON and Excel formats.

## Features

- Automated tender search functionality
- Extracts detailed tender information including:
  - Title
  - Direct link
  - Organization
  - Opening date
  - Estimated value
- Saves results in both JSON and Excel formats
- Automatic timestamp-based file naming
- Error logging and recovery
- Headless browser operation (configurable)

## Prerequisites

- Node.js (v14 or higher)
- npm (Node Package Manager)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/Salvelop07/alertalicitacao_scraper.git
cd alertalicitacao_scraper
```

2. Install dependencies:
```bash
npm install
```

3. Install Playwright browsers:
```bash
npx playwright install chromium
```

## Usage

### Basic Usage

Run the scraper with default settings:

```bash
node scraper.js or npm start
```

### Configuration

The scraper is configured with the following default settings:
- Search keyword: "catarata"
- Output directory: `./results/`
- File formats: JSON and Excel (.xlsx)

To modify the search keyword, edit the `searchKeyword` variable in the `main()` function.

## Code Structure

### TenderScraper Class

#### Constructor
- Initializes base URL and browser configurations
- No parameters required

#### Methods

##### `init()`
- Purpose: Initializes the browser and creates a new page
- Input: None
- Output: Promise<void>

##### `searchTenders(keyword)`
- Purpose: Searches for tenders using provided keyword
- Input: keyword (string)
- Output: Array of tender objects
- Saves results automatically to JSON

##### `extractResults()`
- Purpose: Extracts data from search results page
- Input: None
- Output: Array of tender objects with details

##### `saveResults(results, filename)`
- Purpose: Saves results to JSON file
- Input: 
  - results: Array of tender objects
  - filename: Output file path

##### `saveToExcel(results, filename)`
- Purpose: Saves results to Excel file
- Input:
  - results: Array of tender objects
  - filename: Output file path

##### `close()`
- Purpose: Closes browser and cleans up resources
- Input: None
- Output: Promise<void>

## Output Format

### JSON Structure
```json
{
  "title": "Tender Title",
  "link": "https://full-tender-url",
  "organization": "Organization Name",
  "openingDate": "Opening Date",
  "estimatedValue": "Estimated Value"
}
```

### Excel Structure
- Sheet name: "Tenders"
- Columns:
  - Title
  - Link
  - Organization
  - Opening Date
  - Estimated Value

## File Naming

Output files are automatically named with timestamps:
- JSON: `tender_results_[timestamp].json`
- Excel: `tender_results_[timestamp].xlsx`

## Error Handling

- Failed searches create an `error_page.html` for debugging
- Individual tender parsing errors are logged but don't stop the process
- Browser resources are properly cleaned up even on errors

## Development

### Adding New Features

1. Extend the TenderScraper class with new methods
2. Update the main() function for new functionality
3. Add appropriate error handling
4. Update documentation

### Debugging

- Set `headless: false` in init() to watch the browser
- Check `error_page.html` for failed searches
- Monitor console output for error messages

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit changes
4. Push to the branch
5. Create a Pull Request

## Support

For issues and feature requests, please create an issue in the repository.

## Acknowledgments

- Built with [Playwright](https://playwright.dev/)
- Uses [XLSX](https://www.npmjs.com/package/xlsx) for Excel file generation
