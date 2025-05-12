export const generateConversationNameConfig = (content: string) => {
	return [
		{
			role: 'system',
			content: 'Generate only the chat name based on the first user message. The output should be a concise name that reflects the main idea or topic of the message. Do not include any greetings, introductory words, punctuation, numbers, or any extra text. The output should consist strictly of the generated name without any additional phrases or words.'
		},
		{ role: 'user', content }
	]
}
