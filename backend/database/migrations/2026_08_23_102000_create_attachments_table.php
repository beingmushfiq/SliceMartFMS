<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Wave 4 — infrastructure. DATABASE_DESIGN §3 `attachments`, §14.5.
 *
 * One row per uploaded file, attached to a product, party, employee, expense,
 * batch, delivery or asset (§14.5's closed vocabulary). The file itself lives on
 * a disk; this table is the only record that it belongs to anything.
 *
 * DESIGN — `checksum` is indexed but **not unique**, which looks like a missed
 * de-duplication opportunity and is not. Two parties may legitimately hold the
 * same signed PDF, and the same QC photo may be attached to a batch and to the
 * delivery that shipped it. A unique key would reject the second attachment
 * outright and force the user to re-upload under a different name, which is
 * worse than storing the bytes twice. The index exists so a future
 * content-addressed storage layer can find duplicates deliberately, at which
 * point sharing a blob becomes a storage decision rather than a schema
 * constraint that has already refused the row.
 *
 * DESIGN — deleting the row does not delete the file. Nothing in the database
 * can, and pretending otherwise is how orphaned blobs and, far worse, deleted
 * files with live rows both happen. The owning Action deletes the row inside its
 * transaction and queues the disk removal for after commit — the ARCHITECTURE
 * §5.2 rule that domain events are handled after the transaction commits, in the
 * one case where the side effect is irreversible.
 *
 * DESIGN — `deleted_at` is present, and this is the wave's only soft delete. §1
 * limits `deleted_at` to master data, and an attachment is not master data. The
 * reason it earns one anyway is the paragraph above: a hard delete would commit
 * the row's removal at the same instant the file removal is merely *queued*, and
 * a failed queue job would then leave a file nobody can find and nobody can
 * prove they own. Soft delete makes the disk removal recoverable and gives the
 * purge job a row to work from. Read: `deleted_at` here means "unlinked, file
 * pending removal", not "hidden from the UI".
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('attachments', function (Blueprint $table): void {
            $table->id();

            // NOT NULL — every attachment hangs off a tenant-owned record. There
            // is no platform attachment, so the composite key below is always
            // checked (§1.3 rule 1).
            $table->unsignedBigInteger('tenant_id');
            $table->uuid('uuid');

            // §14.5 — product | party | employee | expense | batch | delivery |
            // asset. Both NOT NULL: an attachment attached to nothing is a
            // leaked file, not a valid row.
            $table->string('attachable_type', 64);
            $table->unsignedBigInteger('attachable_id');

            // The filesystem disk name, stored per row rather than assumed from
            // config, so migrating a tenant to different storage does not
            // invalidate every historical path.
            $table->string('disk', 32);
            $table->string('path', 512);

            // What the user called it. Displayed and used for the download
            // filename; never used to build `path`, which is generated, because
            // a user-supplied name is a traversal vector.
            $table->string('original_name', 255);

            // Recorded at upload from server-side inspection, not from the
            // client's Content-Type header, which is attacker-controlled.
            $table->string('mime_type', 128);
            $table->unsignedBigInteger('size_bytes');

            // SHA-256 of the file. Detects silent corruption on a restore and
            // proves the bytes still match what was uploaded. Indexed, not
            // unique — see the DESIGN note.
            $table->char('checksum', 64);

            $table->foreignId('uploaded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            // See the DESIGN note — "file pending removal", not "hidden".
            $table->softDeletes();

            $table->unique('uuid', 'uq_attachments_uuid');
            $table->unique(['tenant_id', 'id'], 'uq_attachments_tenant_id');

            $table->foreign('tenant_id', 'fk_attachments_tenant')
                ->references('id')
                ->on('tenants')
                ->restrictOnDelete();

            // §1.2 / §14.5 — the polymorphic pair, indexed. This is the only
            // read path that matters: "show me this record's files".
            $table->index(['tenant_id', 'attachable_type', 'attachable_id'], 'ix_attachments_tenant_attachable');

            // Storage accounting per tenant (`plans.limits` carries a storage
            // quota) and duplicate discovery. See the DESIGN note.
            $table->index(['tenant_id', 'checksum'], 'ix_attachments_tenant_checksum');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('attachments');
    }
};
