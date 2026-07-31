import {
  asFloat,
  asFloatArray,
  asInteger,
  asIntegerArray,
} from "./numberUtils";

describe("numberUtils", () => {
  describe("asInteger", () => {
    it("should convert a valid string to an integer", () => {
      const text = "42";
      const result = asInteger(text);
      expect(result).toBe(42);
    });

    it("should return undefined for an invalid string", () => {
      const text = "invalid number";
      const result = asInteger(text);
      expect(result).toBeUndefined();
    });
  });

  describe("asFloat", () => {
    it("should convert a valid string to a float", () => {
      const text = "3.14";
      const result = asFloat(text);
      expect(result).toBeCloseTo(3.14);
    });

    it("should return undefined for an invalid string", () => {
      const text = "invalid number";
      const result = asFloat(text);
      expect(result).toBeUndefined();
    });
  });

  describe("asIntegerArray", () => {
    it("should convert a valid string to an array of integers", () => {
      const text = "1,2,3";
      const result = asIntegerArray(text);
      expect(result).toEqual([1, 2, 3]);
    });

    it("should return undefined for an invalid string", () => {
      const text = "invalid number";
      const result = asIntegerArray(text);
      expect(result).toEqual([undefined]);
    });
  });

  describe("asFloatArray", () => {
    it("should convert a valid string to an array of floats", () => {
      const text = "1.1,2.2,3.3";
      const result = asFloatArray(text);
      expect(result).toEqual([1.1, 2.2, 3.3]);
    });

    it("should return undefined for an invalid string", () => {
      const text = "invalid number";
      const result = asFloatArray(text);
      expect(result).toEqual([undefined]);
    });
  });
});
