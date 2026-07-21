import {
  asJson,
  getNameFromString,
  getTextArrayFromString,
  getTextFontFromString,
} from "./kmlUtils";

describe("kmlUtils", () => {
  describe("getTextArrayFromString", () => {
    it("should parse a valid JSON string into an array", () => {
      const text = '["one", "two", "three"]';
      const result = getTextArrayFromString(text);
      expect(result).toEqual(["one", "two", "three"]);
    });

    it("should return undefined for an invalid JSON string", () => {
      const text = "invalid json";
      const result = getTextArrayFromString(text);
      expect(result).toBeUndefined();
    });
  });

  describe("asJson", () => {
    it("should parse a valid JSON string into an object", () => {
      const text = '{"key": "value"}';
      const result = asJson<{ key: string }>(text);
      expect(result).toEqual({ key: "value" });
    });

    it("should return undefined for an invalid JSON string", () => {
      const text = "invalid json";
      const result = asJson(text);
      expect(result).toBeUndefined();
    });
  });

  describe("getNameFromString", () => {
    it("should return the name without zero-width spaces", () => {
      const text = "Hello\u200B World";
      const result = getNameFromString(text);
      expect(result).toBe("Hello World");
    });

    it("should return the name as is if there are no zero-width spaces", () => {
      const text = "Hello World";
      const result = getNameFromString(text);
      expect(result).toBe("Hello World");
    });

    it("should return undefined if the input is undefined", () => {
      const result = getNameFromString(undefined);
      expect(result).toBeUndefined();
    });
  });

  describe("getTextFontFromString", () => {
    it("should return the main font with fallbacks", () => {
      const font = "14px ClientCustonFont";
      const result = getTextFontFromString(font);
      expect(result).toBe("14px ClientCustonFont, Arial, sans-serif");
    });

    it("should return the main font with other fallbacks", () => {
      const font = "14px ClientCustonFont";
      const result = getTextFontFromString(font, ["foo", "bar"]);
      expect(result).toBe("14px ClientCustonFont, foo, bar");
    });

    it("should handle multiple fonts and remove duplicates", () => {
      const font =
        "normal 14px ClientCustonFont, sans-serif, Arial, Arial, sans-serif";
      const result = getTextFontFromString(font);
      expect(result).toBe("normal 14px ClientCustonFont, Arial, sans-serif");
    });

    it("should replace 'bold' with 'normal' in the main font", () => {
      const font = "bold 14px ClientCustonFont, Arial, sans-serif";
      const result = getTextFontFromString(font);
      expect(result).toBe("normal 14px ClientCustonFont, Arial, sans-serif");
    });
  });
});
