export const authConfig = {
	password: {
		minLength: 8,
		maxLength: 255,
	},
	username: {
		minLength: 3,
		maxLength: 50,
	},
	name: {
		maxLength: 40,
	},
} as const;
