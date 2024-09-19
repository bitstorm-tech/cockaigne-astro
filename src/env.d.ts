/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

declare namespace App {
	interface Locals {
		user: import("./lib/models/user").User;
		basicUser: import("./lib/models/user").BasicUser;
		language: string;
	}
}

interface Window {
	Alpine: import("alpinejs").Alpine;
}
