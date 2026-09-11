import type {
  DesignToken,
  JSONDesignToken,
  JSONDesignTokens,
  TokenError,
} from "./types";

function isPlainObject(value: any) {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);
  return (
    (prototype === null ||
      prototype === Object.prototype ||
      Object.getPrototypeOf(prototype) === null) &&
    !(Symbol.toStringTag in value) &&
    !(Symbol.iterator in value)
  );
}

function _flattenTokens(
  slice: JSONDesignTokens | JSONDesignToken,
  result: { tokens: DesignToken[]; errors: TokenError[] },
  keyMemo: string[],
  inherited: {
    type?: string;
    description?: string;
    extensions?: Record<string, unknown>;
  },
): { tokens: DesignToken[]; errors: TokenError[] } {
  for (let key in slice) {
    if (!Object.hasOwn(slice, key)) {
      continue;
    }

    const sliceValue =
      slice[key as keyof JSONDesignTokens | keyof JSONDesignToken];
    const isPlainObj = isPlainObject(sliceValue);

    if (!isPlainObj) {
      continue;
    }

    if (
      sliceValue &&
      typeof sliceValue === "object" &&
      Object.hasOwn(sliceValue, "$value")
    ) {
      const token = sliceValue as JSONDesignToken;

      const finalType = token.$type ?? inherited.type;
      const finalKey = [...keyMemo, key].join(".");

      if (!finalType) {
        result.errors.push({
          type: "MISSING_TYPE",
          token: { ...token, key: finalKey },
        });
      }

      if (
        ["{", "}", "."].some((char) =>
          [...keyMemo, key].some((kStr) => kStr.includes(char)),
        )
      ) {
        result.errors.push({
          type: "UNAUTHORIZED_KEY_STR",
          token: { ...token, key: finalKey },
        });
      }

      result.tokens.push({
        ...token,
        $type: token.$type ?? inherited.type,
        $description: token.$description ?? inherited.description,
        key: finalKey,
      });
    } else {
      _flattenTokens(
        sliceValue as JSONDesignTokens | JSONDesignToken,
        result,
        keyMemo.concat(key),
        {
          type: (slice as JSONDesignToken).$type ?? inherited.type,
          description:
            (slice as JSONDesignToken).$description ?? inherited.description,
        },
      );
    }
  }
  return result;
}

export function flattenDTCGTokens(tokens: JSONDesignTokens) {
  return _flattenTokens(tokens, { tokens: [], errors: [] }, [], {});
}
