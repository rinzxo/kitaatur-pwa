ALTER TABLE "public"."attendance_sessions"
ADD COLUMN "checkout_pin_code" VARCHAR(10),
ADD COLUMN "checkout_start_time" TIMESTAMPTZ;
