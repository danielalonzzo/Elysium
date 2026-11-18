CREATE TABLE `audit` (
	`id` text PRIMARY KEY NOT NULL,
	`actor` text NOT NULL,
	`action` text NOT NULL,
	`target` text NOT NULL,
	`created` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `bookings` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`pet` text NOT NULL,
	`slot` text NOT NULL,
	`status` text DEFAULT 'confirmed' NOT NULL,
	`created` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `one_active_booking_per_slot` ON `bookings` (`slot`) WHERE `status` != 'cancelled';
--> statement-breakpoint
CREATE TABLE `movements` (
	`id` text PRIMARY KEY NOT NULL,
	`product` text NOT NULL,
	`delta` integer NOT NULL,
	`reason` text NOT NULL,
	`actor` text NOT NULL,
	`created` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `pets` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`name` text NOT NULL,
	`species` text NOT NULL,
	`breed` text DEFAULT '' NOT NULL,
	`birth` text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`sku` text NOT NULL,
	`category` text NOT NULL,
	`lot` text NOT NULL,
	`expiry` text DEFAULT '' NOT NULL,
	`stock` integer DEFAULT 0 NOT NULL,
	`minimum` integer DEFAULT 3 NOT NULL,
	`price` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sku_lot` ON `products` (`sku`,`lot`);--> statement-breakpoint
CREATE TABLE `records` (
	`id` text PRIMARY KEY NOT NULL,
	`pet` text NOT NULL,
	`owner` text NOT NULL,
	`note` text NOT NULL,
	`kind` text NOT NULL,
	`actor` text NOT NULL,
	`created` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `slots` (
	`id` text PRIMARY KEY NOT NULL,
	`day` text NOT NULL,
	`time` text NOT NULL,
	`service` text NOT NULL,
	`active` integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `slot_resource_time` ON `slots` (`day`,`time`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`phone` text DEFAULT '' NOT NULL,
	`role` text DEFAULT 'client' NOT NULL
);
--> statement-breakpoint
CREATE TRIGGER `movement_product_exists` BEFORE INSERT ON `movements`
WHEN NOT EXISTS (SELECT 1 FROM `products` WHERE `id` = NEW.`product`)
BEGIN SELECT RAISE(ABORT, 'product_not_found'); END;
--> statement-breakpoint
CREATE TRIGGER `movement_stock_nonnegative` BEFORE INSERT ON `movements`
WHEN (SELECT `stock` + NEW.`delta` FROM `products` WHERE `id` = NEW.`product`) < 0
BEGIN SELECT RAISE(ABORT, 'insufficient_stock'); END;
--> statement-breakpoint
CREATE TRIGGER `movement_apply_stock` AFTER INSERT ON `movements`
BEGIN UPDATE `products` SET `stock` = `stock` + NEW.`delta` WHERE `id` = NEW.`product`; END;

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS inquiries (id text PRIMARY KEY NOT NULL,name text NOT NULL,phone text NOT NULL,email text DEFAULT '' NOT NULL,topic text NOT NULL,pet_name text DEFAULT '' NOT NULL,species text DEFAULT '' NOT NULL,message text NOT NULL,status text DEFAULT 'new' NOT NULL,created text NOT NULL);
