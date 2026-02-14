-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('super_admin', 'admin', 'editor', 'auditor');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('active', 'inactive', 'suspended');

-- CreateEnum
CREATE TYPE "ScreenOrientation" AS ENUM ('portrait', 'landscape');

-- CreateEnum
CREATE TYPE "ScreenStatus" AS ENUM ('active', 'inactive', 'offline');

-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('image', 'video', 'audio', 'web');

-- CreateEnum
CREATE TYPE "HeartbeatStatus" AS ENUM ('online', 'offline', 'error');

-- CreateEnum
CREATE TYPE "PlaybackStatus" AS ENUM ('completed', 'interrupted', 'error', 'skipped');

-- CreateTable
CREATE TABLE "Organization" (
    "organization_id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("organization_id")
);

-- CreateTable
CREATE TABLE "Role" (
    "role_id" SERIAL NOT NULL,
    "role_name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("role_id")
);

-- CreateTable
CREATE TABLE "users" (
    "user_id" SERIAL NOT NULL,
    "organization_id" INTEGER NOT NULL,
    "role_id" INTEGER NOT NULL,
    "full_name" VARCHAR(150) NOT NULL,
    "email" VARCHAR(150) NOT NULL,
    "password_hash" TEXT NOT NULL,
    "status" "UserStatus" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0),

    CONSTRAINT "users_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "location" (
    "location_id" SERIAL NOT NULL,
    "organization_id" INTEGER NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "address" TEXT,
    "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "location_pkey" PRIMARY KEY ("location_id")
);

-- CreateTable
CREATE TABLE "screen" (
    "screen_id" SERIAL NOT NULL,
    "location_id" INTEGER NOT NULL,
    "screen_name" VARCHAR(150) NOT NULL,
    "device_id" VARCHAR(150) NOT NULL,
    "resolution_width" INTEGER NOT NULL,
    "resolution_height" INTEGER NOT NULL,
    "orientation" "ScreenOrientation" NOT NULL,
    "status" "ScreenStatus" NOT NULL DEFAULT 'inactive',
    "paired_at" TIMESTAMP(0),
    "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "screen_pkey" PRIMARY KEY ("screen_id")
);

-- CreateTable
CREATE TABLE "layout_template" (
    "template_id" SERIAL NOT NULL,
    "organization_id" INTEGER NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "layout_template_pkey" PRIMARY KEY ("template_id")
);

-- CreateTable
CREATE TABLE "template_zone" (
    "template_zone_id" SERIAL NOT NULL,
    "template_id" INTEGER NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "x_position" INTEGER NOT NULL,
    "y_position" INTEGER NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "z_index" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "template_zone_pkey" PRIMARY KEY ("template_zone_id")
);

-- CreateTable
CREATE TABLE "screen_layout" (
    "layout_id" SERIAL NOT NULL,
    "screen_id" INTEGER NOT NULL,
    "template_id" INTEGER,
    "name" VARCHAR(150) NOT NULL,
    "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "screen_layout_pkey" PRIMARY KEY ("layout_id")
);

-- CreateTable
CREATE TABLE "screen_layout_zone" (
    "zone_id" SERIAL NOT NULL,
    "layout_id" INTEGER NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "x_position" INTEGER NOT NULL,
    "y_position" INTEGER NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "z_index" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "screen_layout_zone_pkey" PRIMARY KEY ("zone_id")
);

-- CreateTable
CREATE TABLE "media" (
    "media_id" SERIAL NOT NULL,
    "organization_id" INTEGER NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "file_url" TEXT NOT NULL,
    "media_type" "MediaType" NOT NULL,
    "duration" INTEGER,
    "resolution_width" INTEGER,
    "resolution_height" INTEGER,
    "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "media_pkey" PRIMARY KEY ("media_id")
);

-- CreateTable
CREATE TABLE "playlist" (
    "playlist_id" SERIAL NOT NULL,
    "organization_id" INTEGER NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "playlist_pkey" PRIMARY KEY ("playlist_id")
);

-- CreateTable
CREATE TABLE "playlist_item" (
    "playlist_item_id" SERIAL NOT NULL,
    "playlist_id" INTEGER NOT NULL,
    "media_id" INTEGER NOT NULL,
    "zone_id" INTEGER,
    "display_order" INTEGER NOT NULL,
    "duration_override" INTEGER,

    CONSTRAINT "playlist_item_pkey" PRIMARY KEY ("playlist_item_id")
);

-- CreateTable
CREATE TABLE "schedule" (
    "schedule_id" SERIAL NOT NULL,
    "playlist_id" INTEGER NOT NULL,
    "screen_id" INTEGER,
    "location_id" INTEGER,
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3),
    "recurrence_rule" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "schedule_pkey" PRIMARY KEY ("schedule_id")
);

-- CreateTable
CREATE TABLE "pairing_code" (
    "pairing_code_id" SERIAL NOT NULL,
    "code" VARCHAR(12) NOT NULL,
    "device_id" VARCHAR(255) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "is_used" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pairing_code_pkey" PRIMARY KEY ("pairing_code_id")
);

-- CreateTable
CREATE TABLE "device_token" (
    "token_id" SERIAL NOT NULL,
    "screen_id" INTEGER NOT NULL,
    "token" VARCHAR(512) NOT NULL,
    "issued_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "device_token_pkey" PRIMARY KEY ("token_id")
);

-- CreateTable
CREATE TABLE "heartbeat" (
    "heartbeat_id" SERIAL NOT NULL,
    "screen_id" INTEGER NOT NULL,
    "last_seen" TIMESTAMP(3) NOT NULL,
    "status" "HeartbeatStatus" NOT NULL,

    CONSTRAINT "heartbeat_pkey" PRIMARY KEY ("heartbeat_id")
);

-- CreateTable
CREATE TABLE "heartbeat_log" (
    "id" SERIAL NOT NULL,
    "screen_id" INTEGER NOT NULL,
    "reported_at" TIMESTAMP(3) NOT NULL,
    "status" "HeartbeatStatus" NOT NULL,

    CONSTRAINT "heartbeat_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "playback_log" (
    "log_id" SERIAL NOT NULL,
    "screen_id" INTEGER NOT NULL,
    "media_id" INTEGER NOT NULL,
    "zone_id" INTEGER,
    "played_at" TIMESTAMP(3) NOT NULL,
    "duration_played" INTEGER NOT NULL,
    "status" "PlaybackStatus" NOT NULL,
    "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "playback_log_pkey" PRIMARY KEY ("log_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Role_role_name_key" ON "Role"("role_name");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "screen_device_id_key" ON "screen"("device_id");

-- CreateIndex
CREATE UNIQUE INDEX "layout_template_organization_id_name_key" ON "layout_template"("organization_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "template_zone_template_id_name_key" ON "template_zone"("template_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "screen_layout_screen_id_name_key" ON "screen_layout"("screen_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "screen_layout_zone_layout_id_name_key" ON "screen_layout_zone"("layout_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "playlist_organization_id_name_key" ON "playlist"("organization_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "playlist_item_playlist_id_display_order_key" ON "playlist_item"("playlist_id", "display_order");

-- CreateIndex
CREATE UNIQUE INDEX "pairing_code_code_key" ON "pairing_code"("code");

-- CreateIndex
CREATE UNIQUE INDEX "device_token_token_key" ON "device_token"("token");

-- CreateIndex
CREATE UNIQUE INDEX "heartbeat_screen_id_key" ON "heartbeat"("screen_id");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "Organization"("organization_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "Role"("role_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "location" ADD CONSTRAINT "location_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "Organization"("organization_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "screen" ADD CONSTRAINT "screen_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "location"("location_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "layout_template" ADD CONSTRAINT "layout_template_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "Organization"("organization_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "template_zone" ADD CONSTRAINT "template_zone_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "layout_template"("template_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "screen_layout" ADD CONSTRAINT "screen_layout_screen_id_fkey" FOREIGN KEY ("screen_id") REFERENCES "screen"("screen_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "screen_layout" ADD CONSTRAINT "screen_layout_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "layout_template"("template_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "screen_layout_zone" ADD CONSTRAINT "screen_layout_zone_layout_id_fkey" FOREIGN KEY ("layout_id") REFERENCES "screen_layout"("layout_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media" ADD CONSTRAINT "media_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "Organization"("organization_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "playlist" ADD CONSTRAINT "playlist_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "Organization"("organization_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "playlist_item" ADD CONSTRAINT "playlist_item_playlist_id_fkey" FOREIGN KEY ("playlist_id") REFERENCES "playlist"("playlist_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "playlist_item" ADD CONSTRAINT "playlist_item_media_id_fkey" FOREIGN KEY ("media_id") REFERENCES "media"("media_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "playlist_item" ADD CONSTRAINT "playlist_item_zone_id_fkey" FOREIGN KEY ("zone_id") REFERENCES "screen_layout_zone"("zone_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule" ADD CONSTRAINT "schedule_playlist_id_fkey" FOREIGN KEY ("playlist_id") REFERENCES "playlist"("playlist_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule" ADD CONSTRAINT "schedule_screen_id_fkey" FOREIGN KEY ("screen_id") REFERENCES "screen"("screen_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule" ADD CONSTRAINT "schedule_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "location"("location_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_token" ADD CONSTRAINT "device_token_screen_id_fkey" FOREIGN KEY ("screen_id") REFERENCES "screen"("screen_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "heartbeat" ADD CONSTRAINT "heartbeat_screen_id_fkey" FOREIGN KEY ("screen_id") REFERENCES "screen"("screen_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "heartbeat_log" ADD CONSTRAINT "heartbeat_log_screen_id_fkey" FOREIGN KEY ("screen_id") REFERENCES "screen"("screen_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "playback_log" ADD CONSTRAINT "playback_log_screen_id_fkey" FOREIGN KEY ("screen_id") REFERENCES "screen"("screen_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "playback_log" ADD CONSTRAINT "playback_log_media_id_fkey" FOREIGN KEY ("media_id") REFERENCES "media"("media_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "playback_log" ADD CONSTRAINT "playback_log_zone_id_fkey" FOREIGN KEY ("zone_id") REFERENCES "screen_layout_zone"("zone_id") ON DELETE SET NULL ON UPDATE CASCADE;
