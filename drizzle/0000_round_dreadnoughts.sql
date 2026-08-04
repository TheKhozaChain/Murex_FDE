CREATE TABLE `approval_decisions` (
	`id` text PRIMARY KEY NOT NULL,
	`investigation_id` text NOT NULL,
	`decision` text NOT NULL,
	`identity` text NOT NULL,
	`decided_at` text NOT NULL,
	`payload_json` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_approval_run` ON `approval_decisions` (`investigation_id`);--> statement-breakpoint
CREATE TABLE `audit_events` (
	`id` text PRIMARY KEY NOT NULL,
	`investigation_id` text NOT NULL,
	`sequence` integer NOT NULL,
	`event_type` text NOT NULL,
	`occurred_at` text NOT NULL,
	`payload_json` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_audit_run_sequence` ON `audit_events` (`investigation_id`,`sequence`);--> statement-breakpoint
CREATE INDEX `idx_audit_run` ON `audit_events` (`investigation_id`);--> statement-breakpoint
CREATE TABLE `evaluation_cases` (
	`id` text PRIMARY KEY NOT NULL,
	`incident_id` text NOT NULL,
	`payload_json` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `evaluation_results` (
	`id` text PRIMARY KEY NOT NULL,
	`case_id` text NOT NULL,
	`investigation_id` text NOT NULL,
	`passed` integer NOT NULL,
	`executed_at` text NOT NULL,
	`payload_json` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_evaluation_case_executed` ON `evaluation_results` (`case_id`,`executed_at`);--> statement-breakpoint
CREATE TABLE `evidence_records` (
	`id` text NOT NULL,
	`investigation_id` text NOT NULL,
	`kind` text NOT NULL,
	`payload_json` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_evidence_run_id` ON `evidence_records` (`investigation_id`,`id`);--> statement-breakpoint
CREATE TABLE `incidents` (
	`id` text PRIMARY KEY NOT NULL,
	`payload_json` text NOT NULL,
	`seeded_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `investigation_runs` (
	`id` text PRIMARY KEY NOT NULL,
	`incident_id` text NOT NULL,
	`status` text NOT NULL,
	`provider` text NOT NULL,
	`started_at` text NOT NULL,
	`completed_at` text,
	`snapshot_json` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_investigation_runs_incident_started` ON `investigation_runs` (`incident_id`,`started_at`);--> statement-breakpoint
CREATE TABLE `policy_decisions` (
	`investigation_id` text PRIMARY KEY NOT NULL,
	`result` text NOT NULL,
	`passed` integer NOT NULL,
	`payload_json` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `recommendations` (
	`investigation_id` text PRIMARY KEY NOT NULL,
	`version` integer NOT NULL,
	`outcome` text NOT NULL,
	`payload_json` text NOT NULL,
	`citation_json` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `retrieved_documents` (
	`document_id` text NOT NULL,
	`investigation_id` text NOT NULL,
	`trust` text NOT NULL,
	`relevance_score` integer NOT NULL,
	`payload_json` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_retrieved_run_document` ON `retrieved_documents` (`investigation_id`,`document_id`);--> statement-breakpoint
CREATE TABLE `tool_executions` (
	`id` text PRIMARY KEY NOT NULL,
	`investigation_id` text NOT NULL,
	`tool_name` text NOT NULL,
	`status` text NOT NULL,
	`payload_json` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_tool_executions_run` ON `tool_executions` (`investigation_id`);