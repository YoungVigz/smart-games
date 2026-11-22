import { ConflictException } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import type Redis from "ioredis";

export async function withRedisLock<T>(
	redis: Redis,
	key: string,
	action: () => Promise<T>,
): Promise<T> {
	const token = randomUUID();
	if (!(await redis.set(key, token, "PX", 60000, "NX")))
		throw new ConflictException("Another action is in progress");
	try {
		return await action();
	} finally {
		await redis.eval(
			"if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end",
			1,
			key,
			token,
		);
	}
}
