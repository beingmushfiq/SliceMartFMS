<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Wave 4 — infrastructure. DATABASE_DESIGN §3 `document_sequences`, §1.4.
 *
 * The allocator behind every human-readable document number. §1.4: numbers are
 * issued inside the creating transaction from a row locked `FOR UPDATE`, so gaps
 * and duplicates cannot occur. That lock is the whole design — an
 * application-side `max() + 1` would produce duplicates under concurrency, and a
 * database sequence or AUTO_INCREMENT cannot express a per-tenant, per-period,
 * resettable series with a prefix.
 *
 * OPEN QUESTION Q3 — whether numbering is scoped per company or per branch is
 * unresolved (§19), with a provisional stance of per company. It blocks Phase 5
 * (the `invoices` unique key), not this table: both scope columns are nullable
 * here precisely so the answer can be *configuration* rather than a migration.
 * A tenant-wide series is `(NULL, NULL)`, per company is `(company, NULL)`, per
 * branch is `(company, branch)`. Answering Q3 will pick which shape the seeder
 * writes (§17.2) and which resolution order the allocator walks — neither of
 * which is a schema change. Per §19, Q3 is answered in DECISIONS.md first; this
 * migration does not pre-empt it and no default row is created here (§16.1 rule
 * 3 forbids a migration writing data in any case).
 *
 * FINDING — §3's documented unique key `(tenant_id, company_id, branch_id,
 * document_type)` cannot enforce what §1.4 requires, for the reason §1.1 now
 * records: two of its four columns are nullable, and NULLs never collide in a
 * UNIQUE index on MySQL 8 or SQLite. As documented, `(1, NULL, NULL, 'invoice')`
 * is insertable without limit — so a tenant could hold two invoice series, and
 * the allocator would lock one of them arbitrarily. Two transactions locking
 * different rows for the same document type is exactly the duplicate-number
 * failure the `FOR UPDATE` lock exists to prevent, arriving through the key
 * instead of through the lock. This is the same class of defect as Wave 1's
 * `settings` and Wave 3's `users.email`, and it takes the same fix: the semantic
 * columns stay nullable as documented, and uniqueness is enforced over STORED
 * generated sentinels that fold NULL to 0.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('document_sequences', function (Blueprint $table): void {
            $table->id();

            // NOT NULL — a series always belongs to one tenant. There is no
            // platform document numbering.
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->uuid('uuid');

            // Nullable per §3 — NULL widens the scope. See the Q3 note.
            $table->unsignedBigInteger('company_id')->nullable();
            $table->unsignedBigInteger('branch_id')->nullable();

            // invoice | sales_order | purchase_order | goods_receipt | payment |
            // delivery_order | production_plan | batch | … (§1: VARCHAR,
            // validated by a PHP enum). Seeded per document type by §17.2.
            $table->string('document_type', 64);

            // Tenant-configurable format (§1.4). `prefix` may carry a year or
            // branch token expanded at allocation time.
            $table->string('prefix', 32)->nullable();
            $table->string('suffix', 32)->nullable();

            // Zero-padding width for the numeric part. Default 5 gives
            // INV-00001, the shape most tenants expect; a tenant may change it,
            // and doing so does not retroactively alter issued numbers because
            // the formatted number is snapshotted onto the document.
            $table->unsignedTinyInteger('padding')->default(5);

            // The next number to issue, not the last one issued. Default 1
            // because a fresh series genuinely starts at 1 — this is a known
            // value, not an unknown one, so §18's "nullable with no default"
            // rule for unknowns does not apply.
            $table->unsignedBigInteger('next_number')->default(1);

            // never | yearly | monthly (§3).
            $table->string('reset_period', 16)->default('never');

            // When the counter was last rolled back to 1. NULL means never
            // reset, which for a `never` series is permanent. The allocator
            // compares this against the current period *inside* the same lock, so
            // two transactions cannot both decide a reset is due.
            $table->timestamp('last_reset_at')->nullable();

            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            // Uniqueness sentinels. Never written by application code — the
            // database derives both, so no Action can desynchronise them.
            $table->unsignedBigInteger('company_key')->storedAs('coalesce(company_id, 0)');
            $table->unsignedBigInteger('branch_key')->storedAs('coalesce(branch_id, 0)');

            $table->unique('uuid', 'uq_document_sequences_uuid');

            // §3's key, expressed over the sentinels so it fires on the widest
            // scopes too. See the FINDING above.
            $table->unique(
                ['tenant_id', 'company_key', 'branch_key', 'document_type'],
                'uq_document_sequences_scope'
            );

            // RESTRICT, not SET NULL: §1.3 forbids SET NULL under a composite key
            // led by `tenant_id`, and widening a series' scope by deleting its
            // company would silently merge two numbering streams.
            $table->foreign(['tenant_id', 'company_id'], 'fk_document_sequences_tenant_company')
                ->references(['tenant_id', 'id'])
                ->on('companies')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'branch_id'], 'fk_document_sequences_tenant_branch')
                ->references(['tenant_id', 'id'])
                ->on('branches')
                ->restrictOnDelete();

            // The allocator's lookup: resolve the series for a document type
            // within a tenant, then lock the row it finds.
            $table->index(['tenant_id', 'document_type'], 'ix_document_sequences_tenant_type');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('document_sequences');
    }
};
