/// <reference types="astro/client" />

declare namespace App {
	interface Locals {
		user: import("./lib/models/user").User;
	}
}

interface Window {
	Alpine: import("alpinejs").Alpine;
}
