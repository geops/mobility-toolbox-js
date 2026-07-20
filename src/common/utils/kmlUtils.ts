export const getTextArrayFromString = (text: string): string[] | undefined => {
  let textArray;
  try {
    textArray = JSON.parse(text.replace(/\r?\n/g, "\\n")) as string[];
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Error parsing textArray", text, err);
  }
  return textArray;
};

export const asJson = <T>(text: string): T | undefined => {
  let json: T | undefined = undefined;
  try {
    json = JSON.parse(text) as T;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Error parsing JSON", text, err);
  }
  return json;
};

export const getNameFromString = (text?: string): string | undefined => {
  let name = text;
  if (name && /\u200B/g.test(name)) {
    // We replace empty white spaces used to keep normal spaces before and after the name.
    name = name.replace(/\u200B/g, "");
  }
  return name;
};
