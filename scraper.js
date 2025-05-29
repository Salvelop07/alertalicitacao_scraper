const { chromium } = require('playwright');
const fs = require('fs').promises;
const path = require('path');
const XLSX = require('xlsx');

/**
 * TenderScraper Class
 * Purpose: Manages web scraping operations for tender information from alertalicitacao.com.br
 * 
 * Properties:
 * - baseUrl: Base URL of the target website
 * - browser: Playwright browser instance
 * - context: Browser context for managing sessions
 * - page: Current browser page
 */

class TenderScraper {
    constructor() {
        this.baseUrl = 'https://alertalicitacao.com.br';
        this.browser = null;
        this.context = null;
        this.page = null;
        this.resultsDir = path.join(__dirname, 'results');
    }

    /**
     * ensureResultsDirectory()
     * Purpose: Creates the results directory if it doesn't exist
     * Input: None
     * Output: Promise<void>
     */
    async ensureResultsDirectory() {
        try {
            await fs.access(this.resultsDir);
        } catch (error) {
            // Directory doesn't exist, create it
            await fs.mkdir(this.resultsDir, { recursive: true });
            console.log('Created results directory');
        }
    }

    /**
     * init()
     * Purpose: Initializes the browser and creates a new page for scraping
     * Input: None
     * Output: Promise<void>
     * Throws: Browser initialization errors
     */
    async init() {
        this.browser = await chromium.launch({
            headless: false // Set to false to see the browser in action
        });
        this.context = await this.browser.newContext();
        this.page = await this.context.newPage();
    }

    /**
     * close()
     * Purpose: Cleans up browser resources and closes all connections
     * Input: None
     * Output: Promise<void>
     * Note: Safe to call even if browser or context is null
     */
    async close() {
        await this.context?.close();
        await this.browser?.close();
    }

    /**
     * searchTenders(keyword)
     * Purpose: Searches for tenders using the provided keyword
     * Input: 
     *   - keyword (string): Search term for finding tenders
     * Output: Promise<Array<Object>>
     *   Returns array of tender objects with structure:
     *   {
     *     title: string,
     *     link: string,
     *     organization: string,
     *     openingDate: string,
     *     estimatedValue: string
     *   }
     * Side Effects:
     *   - Saves results to JSON file with timestamp
     *   - Creates error_page.html on failure
     */
    async searchTenders(keyword) {
        try {
            console.log(`Searching for: ${keyword}`);
            await this.page.goto(this.baseUrl);
            const searchInput = await this.page.getByRole('textbox', { name: 'Procurar...' });
            await searchInput.fill(keyword);

            const searchButton = await this.page.getByRole('button', { name: '' }); // Empty name because it's an icon button
            await searchButton.click();

            const results = await this.extractResults();

            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `results/tender_results_${timestamp}.json`;
            await this.saveResults(results, filename);

            return results;

        } catch (error) {
            console.error('Error during search:', error);

            await this.page.content().then(content => 
                fs.writeFile('error_page.html', content, 'utf8')
            ).catch(console.error);
            return [];
        }
    }

    /**
     * extractResults()
     * Purpose: Extracts tender information from the search results page
     * Input: None (uses current page state)
     * Output: Promise<Array<Object>>
     *   Returns array of tender objects containing:
     *   - title: Tender title
     *   - link: Direct URL to tender
     *   - organization: Organization name
     *   - openingDate: Tender opening date
     *   - estimatedValue: Estimated tender value
     * Note: Handles missing data gracefully, continues on per-panel errors
     */
    async extractResults() {
        const panels = await this.page.locator('div.panel').all();
        const results = [];
    
        for (const panel of panels) {
            try {
                const titleLink = await panel.getByRole('link').first();
                const title = await titleLink.textContent();
                const onlyLink = await titleLink.getAttribute('href');
                const link = this.baseUrl + onlyLink;

                let organization;
                const hasOrgao = await panel.getByText('Orgão:', { exact: false }).count() > 0;

                if (hasOrgao) {
                    const orgElement = await panel.getByText('Orgão:', { exact: false }).first();
                    const orgElementText = await orgElement.locator('..').textContent();
                    organization = orgElementText.replace('Orgão:', '').trim();
                }
                else {
                    let allContent = await panel.locator('font').all();
                    allContent = allContent.length > 0 ? allContent : await panel.locator('p').all();

                    for (const p of allContent) {
                        const text = await p.textContent();
                        if (text === text.toUpperCase() && text.match(/[A-Z]/) && !text.includes(':')) {
                            organization = text.trim();
                            break;
                        }
                    }
                }

                const dateElement = await panel.getByText(/Abertura|Data de abertura/, { exact: false });
                const openingDate = await dateElement.locator('..').textContent()
                    .then(text => text.replace(/Abertura:|Data de abertura:/g, '').trim());

                const valueElement = await panel.getByText('Valor:', { exact: false }).first();
                const estimatedValue = await valueElement.locator('..').textContent()
                    .then(text => text.replace('Valor:', '').trim());

                results.push({
                    title,
                    link,
                    organization,
                    openingDate,
                    estimatedValue
                });

            } catch (error) {
                console.error('Error parsing panel:', error);
                continue;
            }
        }
        return results;
    }

    /**
     * saveResults(results, filename)
     * Purpose: Saves scraped results to a JSON file
     * Input:
     *   - results: Array<Object> - Array of tender objects
     *   - filename: string - Path where to save the JSON file
     * Output: Promise<void>
     * Format: JSON with 2-space indentation
     */
    async saveResults(results, filename) {
        
        await this.ensureResultsDirectory();
        await fs.writeFile(
            filename,
            JSON.stringify(results, null, 2),
            'utf8'
        );
        console.log(`Results saved to ${filename}`);
    }

    /**
     * saveToExcel(results, filename)
     * Purpose: Converts and saves tender results to Excel format
     * Input:
     *   - results: Array<Object> - Array of tender objects
     *   - filename: string - Path where to save the Excel file
     * Output: Promise<void>
     * Format: XLSX file with 'Tenders' worksheet
     */
    async saveToExcel(results, filename) {
        try {
            await this.ensureResultsDirectory();
            const workbook = XLSX.utils.book_new();
            const worksheet = XLSX.utils.json_to_sheet(results);
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Tenders');
            XLSX.writeFile(workbook, filename);
            
            console.log(`Results saved to ${filename}`);
        } catch (error) {
            console.error('Error saving to Excel:', error);
        }
    }
}

/**
 * main()
 * Purpose: Orchestrates the scraping process
 * Input: None
 * Output: Promise<void>
 * Process Flow:
 * 1. Initializes scraper
 * 2. Performs search with keyword 'catarata'
 * 3. Saves results to both JSON and Excel
 * 4. Handles cleanup in all cases
 * Error Handling: Logs errors and ensures browser cleanup
 */
async function main() {
    const scraper = new TenderScraper();
    
    try {
        await scraper.init();
        
        const searchKeyword = 'catarata';
        const results = await scraper.searchTenders(searchKeyword);
        
        if (results.length > 0) {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const excelFilename = `results/tender_results_${timestamp}.xlsx`;
            await scraper.saveToExcel(results, excelFilename);
            
            console.log(`\n${results.length} results found and saved to Excel`);
        } else {
            console.log('No results found');
        }
        
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await scraper.close();
    }
}

main().catch(console.error);