<?php

declare(strict_types=1);

namespace Tests\Feature\Database;

use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use PHPUnit\Framework\Attributes\Test;

/**
 * Wave 21: Finance & Costing Schema Tests.
 *
 * Covers:
 *   - chart_of_accounts
 *   - journal_entries
 *   - journal_lines
 *   - expense_categories
 *   - bank_accounts
 *   - expenses
 *   - bank_transactions
 *   - payment_terms
 *   - party_credit_limits
 *   - product_costs
 *   - production_cost_allocations
 */
class Wave21FinanceSchemaTest extends SchemaTestCase
{
    /** @var list<string> */
    private const TABLES = [
        'chart_of_accounts',
        'journal_entries',
        'journal_lines',
        'expense_categories',
        'bank_accounts',
        'expenses',
        'bank_transactions',
        'payment_terms',
        'party_credit_limits',
        'product_costs',
        'production_cost_allocations',
    ];

    #[Test]
    public function all_wave21_tables_exist(): void
    {
        foreach (self::TABLES as $table) {
            $this->assertTrue(
                Schema::hasTable($table),
                "Failed asserting that table [{$table}] exists."
            );
        }
    }

    #[Test]
    public function every_wave21_table_has_tenant_id_in_primary_position(): void
    {
        foreach (self::TABLES as $table) {
            $columns = Schema::getColumnListing($table);
            $this->assertGreaterThanOrEqual(
                2,
                count($columns),
                "Table [{$table}] must have at least 2 columns."
            );
            $this->assertSame(
                'tenant_id',
                $columns[1],
                "Table [{$table}] must place 'tenant_id' at ordinal position 1 (second column after id)."
            );
        }
    }

    #[Test]
    public function soft_delete_and_ledger_compliance(): void
    {
        $softDeleteTables = [
            'chart_of_accounts',
            'journal_entries',
            'journal_lines',
            'expense_categories',
            'bank_accounts',
            'expenses',
            'payment_terms',
            'party_credit_limits',
        ];

        foreach ($softDeleteTables as $table) {
            $this->assertTrue(
                Schema::hasColumn($table, 'deleted_at'),
                "Table [{$table}] must have softDeletes (deleted_at)."
            );
        }

        // Append-only ledgers have no soft deletes
        $appendOnlyTables = [
            'bank_transactions',
            'product_costs',
            'production_cost_allocations',
        ];

        foreach ($appendOnlyTables as $table) {
            $this->assertFalse(
                Schema::hasColumn($table, 'deleted_at'),
                "Table [{$table}] is append-only ledger and must not have deleted_at."
            );
        }

        foreach (self::TABLES as $table) {
            $this->assertTrue(
                Schema::hasColumn($table, 'uuid'),
                "Table [{$table}] must have uuid."
            );
        }
    }

    #[Test]
    public function chart_of_accounts_enforces_company_code_uniqueness(): void
    {
        $plan = $this->insertPlan();
        $t = $this->insertTenant($plan['id'], 't1');
        $c1 = $this->insertCompany($t, ['name' => 'Company A']);
        $c2 = $this->insertCompany($t, ['name' => 'Company B']);

        $this->insertChartOfAccount($t, $c1, '1010');

        // Different company same code is permitted
        $id2 = $this->insertChartOfAccount($t, $c2, '1010', ['account_code' => '1010_UNIQUE']);
        $this->assertGreaterThan(0, $id2);

        // Same company duplicate code rejected
        $this->expectException(QueryException::class);
        $this->insertChartOfAccount($t, $c1, '1010', ['account_code' => '1010_DUPE']);
        DB::table('chart_of_accounts')->insert($this->chartOfAccountAttributes($t, $c1, '1010', ['account_code' => '1010_DUPE']));
    }

    #[Test]
    public function journal_entries_enforces_company_entry_number_uniqueness(): void
    {
        $plan = $this->insertPlan();
        $t = $this->insertTenant($plan['id'], 't1');
        $c = $this->insertCompany($t);

        $this->insertJournalEntry($t, $c, ['entry_number' => 'JE-2026-0001']);

        $this->expectException(QueryException::class);
        DB::table('journal_entries')->insert($this->journalEntryAttributes($t, $c, [
            'entry_number' => 'JE-2026-0001',
        ]));
    }

    #[Test]
    public function journal_lines_cascades_on_entry_delete(): void
    {
        $plan = $this->insertPlan();
        $t = $this->insertTenant($plan['id'], 't1');
        $c = $this->insertCompany($t);
        $coaId = $this->insertChartOfAccount($t, $c);
        $jeId = $this->insertJournalEntry($t, $c);

        $lineId = $this->insertJournalLine($t, $jeId, $coaId);
        $this->assertGreaterThan(0, $lineId);

        // Hard deleting journal entry deletes child lines
        DB::table('journal_entries')->where('id', $jeId)->delete();
        $this->assertNull(DB::table('journal_lines')->where('id', $lineId)->first());
    }

    #[Test]
    public function expense_categories_enforces_code_uniqueness_per_tenant(): void
    {
        $plan = $this->insertPlan();
        $t = $this->insertTenant($plan['id'], 't1');

        $this->insertExpenseCategory($t, 'TRAVEL');

        $this->expectException(QueryException::class);
        DB::table('expense_categories')->insert($this->expenseCategoryAttributes($t, 'TRAVEL', [
            'code' => 'TRAVEL_1',
        ]));
    }

    #[Test]
    public function bank_accounts_enforces_company_code_uniqueness(): void
    {
        $plan = $this->insertPlan();
        $t = $this->insertTenant($plan['id'], 't1');
        $c = $this->insertCompany($t);
        $coaId = $this->insertChartOfAccount($t, $c);

        $this->insertBankAccount($t, $c, $coaId, 'PETTY_CASH');

        $this->expectException(QueryException::class);
        DB::table('bank_accounts')->insert($this->bankAccountAttributes($t, $c, $coaId, 'PETTY_CASH', [
            'code' => 'PETTY_CASH_1',
        ]));
    }

    #[Test]
    public function expenses_enforces_expense_number_uniqueness(): void
    {
        $plan = $this->insertPlan();
        $t = $this->insertTenant($plan['id'], 't1');
        $c = $this->insertCompany($t);
        $b = $this->insertBranch($t, $c);
        $catId = $this->insertExpenseCategory($t);

        $this->insertExpense($t, $c, $b, $catId, ['expense_number' => 'EXP-2026-001']);

        $this->expectException(QueryException::class);
        DB::table('expenses')->insert($this->expenseAttributes($t, $c, $b, $catId, [
            'expense_number' => 'EXP-2026-001',
        ]));
    }

    #[Test]
    public function payment_terms_enforces_code_uniqueness(): void
    {
        $plan = $this->insertPlan();
        $t = $this->insertTenant($plan['id'], 't1');

        $this->insertPaymentTerm($t, 'NET60');

        $this->expectException(QueryException::class);
        DB::table('payment_terms')->insert($this->paymentTermAttributes($t, 'NET60', [
            'code' => 'NET60_1',
        ]));
    }

    #[Test]
    public function party_credit_limits_enforces_party_uniqueness(): void
    {
        $plan = $this->insertPlan();
        $t = $this->insertTenant($plan['id'], 't1');
        $partyId = $this->insertParty($t);

        $this->insertPartyCreditLimit($t, $partyId);

        $this->expectException(QueryException::class);
        DB::table('party_credit_limits')->insert($this->partyCreditLimitAttributes($t, $partyId));
    }

    #[Test]
    public function bank_transactions_paired_transfer_link(): void
    {
        $plan = $this->insertPlan();
        $t = $this->insertTenant($plan['id'], 't1');
        $c = $this->insertCompany($t);
        $coaId = $this->insertChartOfAccount($t, $c);
        $acc1 = $this->insertBankAccount($t, $c, $coaId, 'ACC_1');
        $acc2 = $this->insertBankAccount($t, $c, $coaId, 'ACC_2');

        $outTx = $this->insertBankTransaction($t, $acc1, [
            'direction' => 'out',
            'amount' => '10000.0000',
            'transaction_type' => 'transfer_out',
        ]);

        $inTx = $this->insertBankTransaction($t, $acc2, [
            'direction' => 'in',
            'amount' => '10000.0000',
            'transaction_type' => 'transfer_in',
            'related_transaction_id' => $outTx,
        ]);

        $this->assertGreaterThan(0, $inTx);
        $inRow = DB::table('bank_transactions')->where('id', $inTx)->first();
        $this->assertNotNull($inRow);
        $this->assertSame($outTx, (int) $inRow->related_transaction_id);
    }

    #[Test]
    public function cross_tenant_references_are_rejected(): void
    {
        $plan = $this->insertPlan();
        $t1 = $this->insertTenant($plan['id'], 't1');
        $t2 = $this->insertTenant($plan['id'], 't2');

        $c1 = $this->insertCompany($t1);
        $c2 = $this->insertCompany($t2);
        $coa1 = $this->insertChartOfAccount($t1, $c1);

        // Bank account in tenant 1 trying to reference company in tenant 2
        $this->expectException(QueryException::class);
        $this->insertBankAccount($t1, $c2, $coa1);
    }

    #[Test]
    public function financial_decimal_precision_round_trip(): void
    {
        $plan = $this->insertPlan();
        $t = $this->insertTenant($plan['id'], 't1');
        $unitId = $this->insertUnit($t);
        $productId = $this->insertProduct($t, $unitId);

        $costId = $this->insertProductCost($t, $productId, [
            'material_cost' => '1234.5678',
            'labour_cost' => '567.8901',
            'overhead_cost' => '89.1234',
            'total_cost' => '1891.5813',
        ]);

        $row = DB::table('product_costs')->where('id', $costId)->first();
        $this->assertNotNull($row);
        $this->assertSame(1234.5678, (float) $row->material_cost);
        $this->assertSame(567.8901, (float) $row->labour_cost);
        $this->assertSame(89.1234, (float) $row->overhead_cost);
        $this->assertSame(1891.5813, (float) $row->total_cost);
    }
}
