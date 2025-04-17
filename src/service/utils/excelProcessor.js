const XLSX = require('xlsx');

const processExcelFile = async (file) => {
    try {
        // Read the Excel file
        const workbook = XLSX.readFile(file.path);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Convert to JSON
        const data = XLSX.utils.sheet_to_json(worksheet);

        // Process and validate each row
        const processedItems = data.map((row, index) => {
            try {
                // Check if required fields exist
                if (!row.description || !row.price) {
                    return {
                        valid: false,
                        rowIndex: index + 2, // Excel rows start at 1, and we skip header
                        error: 'Missing required fields (description or price)',
                        rawData: row
                    };
                }

                // Validate price format
                const price = parseFloat(row.price);
                if (isNaN(price)) {
                    return {
                        valid: false,
                        rowIndex: index + 2,
                        error: `Invalid price format: ${row.price}`,
                        rawData: row
                    };
                }

                // Return valid item
                return {
                    valid: true,
                    rowIndex: index + 2,
                    item: {
                        description: row.description.trim(),
                        price: price
                    },
                    rawData: row
                };
            } catch (error) {
                return {
                    valid: false,
                    rowIndex: index + 2,
                    error: `Row processing error: ${error.message}`,
                    rawData: row
                };
            }
        });

        return {
            totalRows: data.length,
            processedItems: processedItems,
            validItems: processedItems.filter(item => item.valid),
            invalidItems: processedItems.filter(item => !item.valid)
        };
    } catch (error) {
        throw new Error(`Error processing Excel file: ${error.message}`);
    }
};

module.exports = {
    processExcelFile
};