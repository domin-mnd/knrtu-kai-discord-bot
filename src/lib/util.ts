/**
 * Форматирование строки, подставляя начальный символ - заглавную букву
 * @param str Текст для форматирования
 * @example
 * const text = 'привет, мир!';
 * console.log(text);
 * // => 'привет, мир!'
 * 
 * const formatted = capitalize(text);
 * console.log(formatted);
 * // => 'Привет, мир!'
 * @returns Строку с заглавной буквой
 */
export function capitalize(str: string) {
	return str.charAt(0).toUpperCase() + str.slice(1);
}