import type { IdOrBasicUser } from "./user";

export namespace AstroService {
	export function extractIdAndBasicUserFromLocals(locals: App.Locals): IdOrBasicUser {
		return {
			id: locals.user.id,
			basicUser: locals.basicUser,
		};
	}
}
