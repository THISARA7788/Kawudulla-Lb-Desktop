# Database Cleanup Scripts

This directory contains scripts to clean up invalid overdue records in the Fine Management system.

## Problem

The "59 days overdue" record in the Pending Overdue Fines table is invalid and should not appear. This is typically caused by:

1. **Orphaned transactions**: Transactions referencing non-existent users or books
2. **Very old overdue records**: Transactions that have been overdue for an excessive period (90+ days)
3. **Data corruption**: Invalid transaction data that prevents proper fine calculation

## Scripts Available

### 1. Cleanup Invalid Overdue Records

**Command:** `npm run cleanup:overdue`

This script will:

1. **Identify problematic overdue transactions**:
   - Transactions overdue for more than 90 days
   - Transactions with missing user or book references

2. **Delete orphaned records**:
   - Related fine records
   - Orphaned user accounts
   - Orphaned book records

3. **Preserve valid records**:
   - Transactions with valid user and book references
   - Recent overdue transactions (under 90 days)

**Safety Features:**
- Only deletes transactions with invalid user/book references
- Preserves transactions with valid data
- Provides detailed logging of all deletions
- Requires manual confirmation before actual deletion

### 2. Verify Cleanup

**Command:** `npm run verify:cleanup`

This script will:

1. **Analyze current overdue status**:
   - Calculate total days overdue across all transactions
   - Identify records with excessive overdue days (>60 days)
   - Check for orphaned references

2. **Provide cleanup verification**:
   - List of potentially problematic records
   - Orphaned record detection
   - Statistics on overdue accumulation

## Usage Instructions

### Before Running Cleanup

1. **Backup your database**:
   ```bash
   mongodump -o backup_$(date +%Y%m%d_%H%M%S)
   ```

2. **Stop the application** to ensure no writes during cleanup

### Running Cleanup

1. **Run the cleanup script**:
   ```bash
   npm run cleanup:overdue
   ```

2. **Verify the cleanup**:
   ```bash
   npm run verify:cleanup
   ```

3. **Restart the application** to apply changes

## Expected Results

After running the cleanup scripts:

1. **Invalid 59-day overdue records** should no longer appear
2. **Fine Management page** will show updated statistics
3. **Orphaned records** will be removed
4. **Data integrity** will be restored

## Notes

- The cleanup script only deletes records that are clearly invalid
- Valid transactions with legitimate overdue status will be preserved
- The script provides detailed logging for audit purposes
- Always backup your database before running cleanup scripts

## Troubleshooting

If you encounter issues:

1. **Check database connection**: Ensure MongoDB is running
2. **Verify script permissions**: Make sure the script has execution permissions
3. **Review logs**: Check the script output for detailed error messages
4. **Restore from backup**: If needed, restore from your backup

## Support

For issues with the cleanup scripts, please:
1. Check the script output for error messages
2. Verify database connectivity
3. Ensure all required dependencies are installed
4. Contact support if issues persist

---

**Note:** These scripts are designed to be safe and conservative. They only delete records that are clearly invalid and preserve all valid data. Always run a backup before performing any database cleanup operations.