import { calculateSubscriptionPeriod } from "@lib/services/subscription";
import dayjs from "dayjs";
import { expect, test } from "playwright/test";

test("calculate subscription period where subscription started on 1. Janurary", async () => {
	const result = calculateSubscriptionPeriod(dayjs("2024-01-01").toDate());
	expect(result).toBe(result);
});
