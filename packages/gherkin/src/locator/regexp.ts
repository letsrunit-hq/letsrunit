const SELECTOR = /(?:the )?(?!page\b)\w+(?: "[^"]*")?|`([^`]+|\\.)*`/;
export const locatorRegexp = new RegExp(String.raw`((?:${SELECTOR.source})(?: with(?:in|out)? (?:${SELECTOR.source}))*)`);
