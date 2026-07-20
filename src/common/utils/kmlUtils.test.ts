import { asJson, getNameFromString, getTextArrayFromString } from "./kmlUtils";

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
});
