-- =========================================================================
-- KITAATUR - DATABASE SCHEMA INITIALIZATION FOR STAGING (SUPABASE)
-- =========================================================================

-- Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "auth";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "public"."user_global_role" AS ENUM ('developer', 'head', 'user');

-- CreateEnum
CREATE TYPE "public"."org_member_role" AS ENUM ('head', 'bendahara', 'sekretaris', 'member', 'auditor');

-- CreateEnum
CREATE TYPE "public"."financial_type" AS ENUM ('income', 'expense');

-- CreateEnum
CREATE TYPE "public"."attendance_status" AS ENUM ('present', 'absent', 'late', 'excused');

-- CreateEnum
CREATE TYPE "public"."goal_status" AS ENUM ('active', 'completed', 'failed');

-- CreateEnum
CREATE TYPE "public"."subscription_status" AS ENUM ('active', 'past_due', 'canceled', 'unpaid');

-- CreateTable
CREATE TABLE "public"."profiles" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "full_name" TEXT,
    "avatar_url" TEXT,
    "global_role" "public"."user_global_role" NOT NULL DEFAULT 'user',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."organizations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "owner_id" UUID NOT NULL,
    "logo_url" TEXT,
    "invite_code" TEXT,
    "dues_target_amount" DECIMAL(15,2),
    "dues_presets" TEXT DEFAULT '10000,20000,50000,100000',
    "custom_fields_schema" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."organization_members" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "profile_id" UUID NOT NULL,
    "role" "public"."org_member_role" NOT NULL DEFAULT 'member',
    "custom_data" JSONB,
    "joined_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "organization_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."financial_records" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID,
    "profile_id" UUID NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "type" "public"."financial_type" NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "receipt_url" TEXT,
    "transaction_date" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "financial_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."attendance" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "profile_id" UUID NOT NULL,
    "session_id" UUID,
    "status" "public"."attendance_status" NOT NULL DEFAULT 'present',
    "notes" TEXT,
    "proof_url" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "distance_meters" DOUBLE PRECISION,
    "check_in_time" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "check_out_time" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."attendance_sessions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "created_by" UUID NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'Sesi Absensi',
    "session_type" TEXT NOT NULL DEFAULT 'in_only',
    "pin_code" VARCHAR(10) NOT NULL,
    "checkout_pin_code" VARCHAR(10),
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "radius_meters" INTEGER NOT NULL DEFAULT 50,
    "start_time" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "end_time" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "checkout_start_time" TIMESTAMPTZ,
    "late_time" TIMESTAMPTZ,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closed_at" TIMESTAMPTZ,
    "shared_with_orgs" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "pending_shared_orgs" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "attendance_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."meeting_minutes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "session_id" UUID,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "ai_summary" TEXT,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "meeting_minutes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."notifications" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "profile_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."push_subscriptions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "profile_id" UUID NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "push_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."goals" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID,
    "profile_id" UUID NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'saving',
    "budget_category" TEXT,
    "period" TEXT DEFAULT 'monthly',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "target_amount" DECIMAL(15,2),
    "current_amount" DECIMAL(15,2) DEFAULT 0.00,
    "deadline" DATE,
    "status" "public"."goal_status" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."goal_transactions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "goal_id" UUID NOT NULL,
    "profile_id" UUID NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'income',
    "source" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "goal_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."subscriptions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "profile_id" UUID NOT NULL,
    "pakasir_subscription_id" TEXT,
    "status" "public"."subscription_status" NOT NULL DEFAULT 'active',
    "plan_type" TEXT NOT NULL,
    "payment_url" TEXT,
    "amount_paid" DECIMAL(15,2),
    "starts_at" TIMESTAMPTZ NOT NULL,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "profiles_email_key" ON "public"."profiles"("email");

-- CreateIndex
CREATE UNIQUE INDEX "organizations_slug_key" ON "public"."organizations"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "organizations_invite_code_key" ON "public"."organizations"("invite_code");

-- CreateIndex
CREATE UNIQUE INDEX "organization_members_organization_id_profile_id_key" ON "public"."organization_members"("organization_id", "profile_id");

-- CreateIndex
CREATE UNIQUE INDEX "meeting_minutes_session_id_key" ON "public"."meeting_minutes"("session_id");

-- CreateIndex
CREATE UNIQUE INDEX "push_subscriptions_endpoint_key" ON "public"."push_subscriptions"("endpoint");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_pakasir_subscription_id_key" ON "public"."subscriptions"("pakasir_subscription_id");

-- AddForeignKey
ALTER TABLE "public"."organizations" ADD CONSTRAINT "organizations_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."organization_members" ADD CONSTRAINT "organization_members_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."organization_members" ADD CONSTRAINT "organization_members_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."financial_records" ADD CONSTRAINT "financial_records_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."financial_records" ADD CONSTRAINT "financial_records_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."attendance" ADD CONSTRAINT "attendance_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."attendance" ADD CONSTRAINT "attendance_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."attendance" ADD CONSTRAINT "attendance_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."attendance_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."attendance_sessions" ADD CONSTRAINT "attendance_sessions_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."attendance_sessions" ADD CONSTRAINT "attendance_sessions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."meeting_minutes" ADD CONSTRAINT "meeting_minutes_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."meeting_minutes" ADD CONSTRAINT "meeting_minutes_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."attendance_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."meeting_minutes" ADD CONSTRAINT "meeting_minutes_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."notifications" ADD CONSTRAINT "notifications_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."push_subscriptions" ADD CONSTRAINT "push_subscriptions_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."goals" ADD CONSTRAINT "goals_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."goals" ADD CONSTRAINT "goals_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."goal_transactions" ADD CONSTRAINT "goal_transactions_goal_id_fkey" FOREIGN KEY ("goal_id") REFERENCES "public"."goals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."goal_transactions" ADD CONSTRAINT "goal_transactions_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."subscriptions" ADD CONSTRAINT "subscriptions_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- =========================================================================
-- PROFILE TRIGGER FROM auth.users
-- =========================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url, global_role)
    VALUES (
        new.id,
        new.email,
        coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
        new.raw_user_meta_data->>'avatar_url',
        'user'
    );
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
