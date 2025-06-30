export function reduceStrings({ strings, separator = " " }: { strings: string[], separator?: string}): string {
    return strings.join(separator);
}