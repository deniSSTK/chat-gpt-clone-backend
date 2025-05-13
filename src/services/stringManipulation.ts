export const trimText= (text: string, maxLength = 20) => {
	const words = text.split(' ');
	let result = '';

	for (const word of words) {
		if ((result + word).length > maxLength) break;
		result += (result ? ' ' : '') + word;
	}

	return result;
}